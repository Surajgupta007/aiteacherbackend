const User = require('../models/User');
const Quiz = require('../models/Quiz');
const sendTokenResponse = require('../utils/sendTokenResponse');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Multer config — memory storage so we can stream to Cloudinary
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Please upload an image file'), false);
    }
};

exports.upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

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

        // Upload buffer to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'studysmart_profiles',
                    public_id: `profile_${req.user.id}`,
                    overwrite: true,
                    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Save Cloudinary URL to user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: result.secure_url },
            { new: true }
        );

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Profile picture upload error:', error);
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
