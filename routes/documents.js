const express = require('express');
const router = express.Router();

console.log("🔥 DOCUMENT ROUTES FILE LOADED");

const upload = require('../config/multer');
const { protect } = require('../middleware/auth');

const {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    getSignedFileUrl
} = require('../controllers/documents');

// Upload document
router.post('/', protect, upload.single('file'), uploadDocument);

// Get all documents
router.get('/', protect, getDocuments);


console.log("uploadDocument:", typeof uploadDocument);
console.log("getDocuments:", typeof getDocuments);
console.log("getDocument:", typeof getDocument);
console.log("deleteDocument:", typeof deleteDocument);
console.log("getSignedFileUrl:", typeof getSignedFileUrl);
console.log("protect:", typeof protect);
// Get single document
router.get('/:id', protect, getDocument);

// Get signed URL
router.get('/:id/file-url', protect, getSignedFileUrl);

// Delete document
router.delete('/:id', protect, deleteDocument);

module.exports = router;