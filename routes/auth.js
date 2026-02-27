const express = require('express');
const { signup, login, getMe, updateProfile, uploadProfilePicture, getProfileStats, upload } = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/me/photo', protect, upload.single('profilePicture'), uploadProfilePicture);
router.get('/me/stats', protect, getProfileStats);

module.exports = router;
