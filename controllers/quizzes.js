const Quiz = require('../models/Quiz');

// @desc      Get all quizzes for user
// @route     GET /api/v1/quizzes
// @access    Private
exports.getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ user: req.user.id }).sort('-createdAt');
        res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Get single quiz
// @route     GET /api/v1/quizzes/:id
// @access    Private
exports.getQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate({
            path: 'document',
            select: 'fileName'
        });

        if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });
        if (quiz.user.toString() !== req.user.id) return res.status(401).json({ success: false, error: 'Not authorized' });

        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Update quiz score
// @route     PUT /api/v1/quizzes/:id/score
// @access    Private
exports.updateQuizScore = async (req, res) => {
    try {
        let quiz = await Quiz.findById(req.params.id);

        if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });
        if (quiz.user.toString() !== req.user.id) return res.status(401).json({ success: false, error: 'Not authorized' });

        quiz = await Quiz.findByIdAndUpdate(req.params.id, { score: req.body.score }, { new: true });
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
