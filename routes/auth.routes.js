const express = require("express");
const router = express.Router();
const upload = require("../utils/multer.file.upload");
const Auth = require("../middlewares/auth.middleware");
const OtpController = require("../controllers/otp.controller");
const AuthController = require("../controllers/auth.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");
const SessionController = require("../controllers/sessions.controller");
const verifyEmailController = require("../controllers/varify.email.controller");
const ForgotPasswordController = require("../controllers/forgot.password.controller");

// authentication
router.post("/user/login", AuthController.userLogin);
router.post("/user/logout", AuthController.logoutUser);

// otp
router.post("/otp/enable", Auth.isAuthenticated, OtpController.enableOtp);
router.post("/otp/disable", Auth.isAuthenticated, OtpController.disableOtp);
router.post("/otp/send", Auth.isAuthenticated, OtpController.sendOtp);
router.post("/otp/verify", Auth.isAuthenticated, OtpController.verifyOtp);

// user
router.post("/user/create", AuthController.createUser);
router.get("/user/verify-email", verifyEmailController.verifyEmail);
router.post(
  "/user/update/:id",
  isAuthenticated,
  upload.single("avatar"),
  AuthController.updateUser
);

// forgot password
router.post("/user/reset/password", ForgotPasswordController.resetPassword);
router.post(
  "/verify/forgot/password",
  ForgotPasswordController.verifyForgotPassword
);

// Auth User Sessions
router.get("/user/sessions", isAuthenticated, SessionController.getSessions);
router.delete(
  "/user/terminate/session/:Id",
  isAuthenticated,
  SessionController.terminateSessionById
);
router.delete(
  "/user/terminate/all-sessions",
  isAuthenticated,
  SessionController.terminateAllSessions
);

module.exports = router;
