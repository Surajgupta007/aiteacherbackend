const Document = require('../models/Document');
const path = require('path');
const cloudinary = require('../config/cloudinary');

// ============================
// 🔥 Upload to Cloudinary
// ============================
const uploadToCloudinary = (buffer, originalName) => {
    return new Promise((resolve, reject) => {
        console.log("🚀 Starting Cloudinary upload...");
        console.log("📄 Original Name:", originalName);

        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw', // VERY IMPORTANT
                type: 'upload',
                folder: 'studysmart_docs',
                public_id: `${Date.now()}_${path.parse(originalName).name}`
            },
            (error, result) => {
                if (error) {
                    console.error("❌ Cloudinary Upload Error:", error);
                    return reject(error);
                }

                console.log("✅ Upload Successful!");
                console.log("RESOURCE TYPE:", result.resource_type);
                console.log("DELIVERY TYPE:", result.type);
                console.log("FORMAT:", result.format);
                console.log("SECURE URL:", result.secure_url);

                resolve(result);
            }
        );

        stream.end(buffer);
    });
};

// ============================
// 🔥 Upload Document
// ============================
exports.uploadDocument = async (req, res) => {
    try {
        console.log("📥 Upload API Hit");

        if (!req.file) {
            console.log("❌ No file in request");
            return res.status(400).json({
                success: false,
                error: 'Please upload a PDF file'
            });
        }

        console.log("📦 File Size:", req.file.size);
        console.log("📦 Buffer Exists:", !!req.file.buffer);

        const result = await uploadToCloudinary(
            req.file.buffer,
            req.file.originalname
        );

        console.log("💾 Saving document to MongoDB...");

        const document = await Document.create({
            user: req.user.id,
            fileName: req.file.originalname,
            filePath: result.secure_url,
            cloudinaryPublicId: result.public_id,
            fileSize: req.file.size
        });

        console.log("✅ Document Saved:", document._id);

        res.status(201).json({
            success: true,
            data: document
        });

    } catch (error) {
        console.error("🔥 Upload Controller Error:", error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// ============================
// 🔥 Get All Documents
// ============================
exports.getDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ user: req.user.id }).sort('-uploadDate');
        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================
// 🔥 Get Single Document
// ============================
exports.getDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) return res.status(404).json({ success: false, error: 'Document not found' });
        if (document.user.toString() !== req.user.id) return res.status(401).json({ success: false, error: 'Not authorized' });

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================
// 🔥 Get Signed URL
// ============================
exports.getSignedFileUrl = async (req, res) => {
    try {
        console.log("🔍 Fetching file URL for:", req.params.id);

        const document = await Document.findById(req.params.id);

        if (!document) {
            console.log("❌ Document not found");
            return res.status(404).json({ success: false });
        }

        if (document.user.toString() !== req.user.id) {
            console.log("❌ Unauthorized access attempt");
            return res.status(401).json({ success: false });
        }

        console.log("✅ Returning URL:", document.filePath);

        res.json({
            success: true,
            url: document.filePath
        });

    } catch (error) {
        console.error("🔥 getSignedFileUrl Error:", error);
        res.status(400).json({ success: false });
    }
};

// ============================
// 🔥 Delete Document
// ============================
exports.deleteDocument = async (req, res) => {
    try {
        console.log("🗑 Delete Request:", req.params.id);

        const document = await Document.findById(req.params.id);

        if (!document)
            return res.status(404).json({ success: false });

        if (document.user.toString() !== req.user.id)
            return res.status(401).json({ success: false });

        if (document.cloudinaryPublicId) {
            console.log("☁️ Deleting from Cloudinary:", document.cloudinaryPublicId);

            await cloudinary.uploader.destroy(
                document.cloudinaryPublicId,
                { resource_type: 'raw' }
            );
        }

        await document.deleteOne();

        console.log("✅ Document deleted");

        res.status(200).json({
            success: true
        });

    } catch (error) {
        console.error("🔥 Delete Error:", error);
        res.status(400).json({ success: false });
    }
};