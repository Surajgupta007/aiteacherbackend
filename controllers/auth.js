const User = require('../models/User');
const Quiz = require('../models/Quiz');
const sendTokenResponse = require('../utils/sendTokenResponse');
const path = require('path');
const multer = require('multer');

// Multer config for profile pictures
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `profile_${req.user.id}_${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Please upload an image file'), false);
    }
};

exports.upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// @desc      Register user
// @route     POST /api/v1/auth/signup
// @access    Public
exports.signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const user = await User.create({
            name,
            email,
            password
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Get current logged in user
// @route     GET /api/v1/auth/me
// @access    Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Update user profile (name, email)
// @route     PUT /api/v1/auth/me
// @access    Private
exports.updateProfile = async (req, res) => {
    try {
        const fieldsToUpdate = {};
        if (req.body.name) fieldsToUpdate.name = req.body.name;
        if (req.body.email) fieldsToUpdate.email = req.body.email;

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Upload profile picture
// @route     PUT /api/v1/auth/me/photo
// @access    Private
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a file' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: `/uploads/${req.file.filename}` },
            { new: true }
        );

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc      Get profile stats (quiz/test stats)
// @route     GET /api/v1/auth/me/stats
// @access    Private
exports.getProfileStats = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ user: req.user.id }).sort('-createdAt');

        const totalQuizzes = quizzes.length;
        const totalScore = quizzes.reduce((sum, q) => sum + (q.score || 0), 0);
        const totalQuestions = quizzes.reduce((sum, q) => sum + (q.totalQuestions || 0), 0);
        const bestScore = quizzes.length > 0
            ? Math.max(...quizzes.map(q => q.totalQuestions > 0 ? Math.round((q.score / q.totalQuestions) * 100) : 0))
            : 0;
        const averageScore = totalQuestions > 0
            ? Math.round((totalScore / totalQuestions) * 100)
            : 0;

        // Recent 5 quizzes
        const recentQuizzes = quizzes.slice(0, 5).map(q => ({
            id: q._id,
            score: q.score,
            totalQuestions: q.totalQuestions,
            percentage: q.totalQuestions > 0 ? Math.round((q.score / q.totalQuestions) * 100) : 0,
            createdAt: q.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                totalQuizzes,
                totalScore,
                totalQuestions,
                bestScore,
                averageScore,
                recentQuizzes
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
