const express = require('express');
const {
    getQuizzes,
    getQuiz,
    updateQuizScore
} = require('../controllers/quizzes');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getQuizzes);
router.route('/:id').get(protect, getQuiz);
router.route('/:id/score').put(protect, updateQuizScore);

module.exports = router;
