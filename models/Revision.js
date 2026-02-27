const mongoose = require('mongoose');

const RevisionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    document: {
        type: mongoose.Schema.ObjectId,
        ref: 'Document',
        required: true
    },
    duration: {
        type: Number,
        default: 30
    },
    plan: {
        type: Object, // Store the generated plan object here initially
        required: true
    },
    rapidFireScore: {
        type: Number,
        default: 0
    },
    rapidFireTotal: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Revision', RevisionSchema);
