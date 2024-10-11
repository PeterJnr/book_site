const Model = require("../models/otp.model");
const getUser = require("../models/queries.general");
const { generateOTP } = require("../utils/helper.functions");
const { sendOtpEmail } = require("../models/mail.model");
const User = require("../models/user.model");

exports.enableOtp = async (req, res) => {
  const { userId } = req.user;
  try {
    const user = await Model.enableOtpForUser(userId);
    return res.status(200).json({
      success: true,
      message: "OTP enabled successfully",
      result: user,
    });
  } catch (error) {
    console.error("Error enabling OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.disableOtp = async (req, res) => {
  const { userId } = req.user;
  try {
    const user = await Model.disableOtpForUser(userId);
    return res.status(200).json({
      success: true,
      message: "OTP disabled successfully",
      result: user,
    });
  } catch (error) {
    console.error("Error disabling OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.sendOtp = async (req, res) => {
  const { userId } = req.user;
  const otpCode = generateOTP();
  const expires_at = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
  const ip_address = req.ip; // Get IP address from the request
  const device_info = req.headers["user-agent"]; // Get device info from user agent string

  try {
    const userResult = await getUser.fetch_all_by_key("users", "id", userId);

    // Check if any user was returned
    if (userResult.rowCount === 0) {
      return res.status(404).json({
        message: "User not found.",
        success: false,
        error: 1,
      });
    }

    const user = userResult.rows[0];

    // Save OTP to database
    await Model.createOtp(userId, otpCode, expires_at, ip_address, device_info);

    // Send OTP to user (via email/SMS)
    await sendOtpEmail(user, otpCode); // Function to send OTP

    // Format the expiration time
    const expirationTime = expires_at.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully! It will expire at ${expirationTime}.`,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const { userId } = req.user;
  const { otpCode } = req.body; // Assuming OTP is sent in the request body

  try {
    const userResult = await getUser.fetch_all_by_key("users", "id", userId);

    // Check if any user was returned
    if (userResult.rowCount === 0) {
      return res.status(404).json({
        message: "User not found.",
        success: false,
        error: 1,
      });
    }

    const user = userResult.rows[0];

    // Find active OTP for the user
    const otp = await Model.findActiveOtpByUserId(user.id);
    if (!otp) {
      return res.status(404).json({
        success: false,
        message: "No active OTP found",
      });
    }

    // Verify OTP
    const verifiedOtp = await Model.findActiveOtpByUserIdAndCode(userId, otpCode);
    if (!verifiedOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark OTP as verified (update the database)
    await Model.verifyOtp(otp.id); // Function to mark OTP as verified

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};
