const express = require("express");
const router = express.Router();
// const authenticateToken = require('../middlewares/auth.middleware')
const AuthController = require('../controllers/auth.controller')
const SessionController = require("../controllers/sessions.controller")
const ForgotPasswordController = require('../controllers/forgot.password.controller')
const {isAuthenticated} = require("../middlewares/auth.middleware")
// const { generateAccessToken, generateRefreshToken } = require('../utils/token.utility');

// authentication
router.post("/user/login", AuthController.userLogin);
router.post("/user/logout", AuthController.logoutUser);
// router.post("/refresh/token", Auth.isAllUsers, AuthController.refreshToken);
// router.post("/check/token", Auth.isAuthenticated, AuthController.checkToken);

// user 
router.post("/user/create", AuthController.createUser);
router.post("/user/update/:id", isAuthenticated, AuthController.updateUser);


// forgot password
router.post("/user/reset/password", ForgotPasswordController.resetPassword);
router.post("/verify/forgot/password", ForgotPasswordController.verifyForgotPassword);

// Auth User Sessions
router.get('/user/sessions', isAuthenticated, SessionController.getSessions);
router.delete('/user/terminate/session/:Id', isAuthenticated, SessionController.terminateSessionById);
router.delete('/user/terminate/all-sessions', isAuthenticated, SessionController.terminateAllSessions);

module.exports = router;