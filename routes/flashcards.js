const express = require('express');
const {
    getFlashcards,
    getFlashcardsByDocument,
    toggleFavorite,
    deleteFlashcard
} = require('../controllers/flashcards');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getFlashcards);
router.route('/document/:docId').get(protect, getFlashcardsByDocument);
router.route('/:id').delete(protect, deleteFlashcard);
router.route('/:id/favorite').put(protect, toggleFavorite);

module.exports = router;
