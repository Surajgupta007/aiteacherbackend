const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    document: {
        type: mongoose.Schema.ObjectId,
        ref: 'Document',
        required: false // Can also be general
    },
    question: {
        type: String,
        required: [true, 'Please add a question']
    },
    answer: {
        type: String,
        required: [true, 'Please add an answer']
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Flashcard', FlashcardSchema);
