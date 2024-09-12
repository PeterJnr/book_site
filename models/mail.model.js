const passwordReset = require("../emailTemplates/password.reset");
const emailVerify = require("../emailTemplates/confirm.registration.email");
const transporter = require('../services/mail.transporter')

const NODE_ENV = process.env.NODE_ENV;
const PROD_FRONTEND = process.env.PROD_FRONTEND;
const DEV_FRONTEND = process.env.DEV_FRONTEND;


const sendResetLink = async (user, hashedToken, response) => {
    // Password Reset link
    const passwordResetLink = `${
      NODE_ENV === "development" ? PROD_FRONTEND : DEV_FRONTEND
    }/auth/password/reset/${hashedToken}`;
  
    // Send email
    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Link",
      html: passwordReset(user, passwordResetLink),
    };
  
    try {
      let info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
      return true;
    } catch (error) {
      console.error("Error sending Password Reset link:", error);
      return false;  
    }
  };

  const sendVerificationEmail = async (user, token) => {
    const verificationUrl = `http://yourdomain.com/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Email Verification',
      html: emailVerify(user, token)
    };
    
    await transporter.sendMail(mailOptions);
  }

  module.exports = {
    sendResetLink,
    sendVerificationEmail
  }