const express = require('express');
const {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    getSignedFileUrl
} = require('../controllers/documents');

const Document = require('../models/Document');

const router = express.Router();

const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

router
    .route('/')
    .post(protect, upload.single('file'), uploadDocument)
    .get(protect, getDocuments);

router.get('/:id/file-url', protect, getSignedFileUrl);

router
    .route('/:id')
    .get(protect, getDocument)
    .delete(protect, deleteDocument);

module.exports = router;
