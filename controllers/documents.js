const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, originalName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw',
                type: 'upload',
                access_mode: 'public',
                folder: 'studysmart_docs',
                public_id: `${Date.now()}_${path.parse(originalName).name}.pdf`,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// @desc      Upload document
// @route     POST /api/v1/documents
// @access    Private
exports.uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a PDF file' });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

        const document = await Document.create({
            user: req.user.id,
            fileName: req.file.originalname,
            filePath: result.secure_url,  // Cloudinary URL
            fileSize: req.file.size
        });

        res.status(201).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Get all documents for logged in user
// @route     GET /api/v1/documents
// @access    Private
exports.getDocuments = async (req, res, next) => {
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

// @desc      Get single document
// @route     GET /api/v1/documents/:id
// @access    Private
exports.getDocument = async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Make sure user owns document
        if (document.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to access this document' });
        }

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Delete document
// @route     DELETE /api/v1/documents/:id
// @access    Private
exports.deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Make sure user owns document
        if (document.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to access this document' });
        }

        // Delete file from filesystem
        fs.unlink(document.filePath, (err) => {
            if (err) console.error(err);
        });

        await document.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
