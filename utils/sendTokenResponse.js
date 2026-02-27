// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token (assuming a method getSignedJwtToken on User method, let's implement it here directly or in User model)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture || ''
            }
        });
};

module.exports = sendTokenResponse;
