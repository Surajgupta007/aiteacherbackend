const express = require('express');
const {
    generateSummary,
    explainConcept,
    generateFlashcards,
    generateQuiz,
    chatWithDocument
} = require('../controllers/ai');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.post('/summary', protect, generateSummary);
router.post('/explain', protect, explainConcept);
router.post('/flashcards', protect, generateFlashcards);
router.post('/quiz', protect, generateQuiz);
router.post('/chat', protect, chatWithDocument);

module.exports = router;
