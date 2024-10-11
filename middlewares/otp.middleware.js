const Otp = require('../models/otp.model.js')

const verifyOtpMiddleware = async (req, res, next) => {
    const { user } = req;
    
    // Check if OTP is enabled for the user
    if (user.otp_enabled) {
      const otpRecord = await Otp.findActiveOtpByUserId(user.id);
      if (!otpRecord || otpRecord.verified) {
        return res.status(401).json({
          success: false,
          message: "OTP verification required",
        });
      }
    }
  
    next(); // if OTP is not enabled or already verified, proceed
  };
  