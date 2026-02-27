const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: [true, 'Please provide a file name']
    },
    filePath: {
        type: String,
        required: true
    },
    cloudinaryPublicId: {
        type: String,
        default: null
    },
    fileSize: {
        type: Number, // In bytes
        required: true
    },
    summary: {
        type: String,
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', DocumentSchema);
