const User = require('../models/user.model')

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
        result: {},
        error: 1,
      });
    }

    // Verify the token and update the user's verification status
    const user = await User.findByVerificationToken(token);
    if(!user) {
        return res.status(404).json({
            message: 'No record found!',
            success: false,
            error: 2,
            result: {},
        });
    }

    const result = await User.verifyUserEmail(user.id);

    if (result) {
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now log in.',
        result: result.rows[0],
        error: 0,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
        result: {},
        error: 2,
      });
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
      result: {},
      error: 3,
    });
  }
};