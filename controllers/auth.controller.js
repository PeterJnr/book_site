const bcrypt = require("bcrypt");
const { pool } = require("../services/pg_pool");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Password = require("../models/password.model");
const Schema = require("../schemas/user.schema");
const { validatePassword } = require("../utils/validation.utils");
const passwordUtil = require("../utils/password.utils");
const { createSession } = require("../controllers/sessions.controller");

// Blacklist to store invalidated JWTs
const jwtBlacklist = new Set();

const blacklistToken = (token) => jwtBlacklist.add(token);

exports.createUser = async (req, res) => {
  try {
    const body = req.body;

    // Validate the request body against the schema
    const { error, value } = Schema.userCreateSchema.validate(body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body.",
        error: error.details,
      });
    }

    // Validate password criteria
    if (!validatePassword(body.password)) {
      return res.status(422).json({
        success: false,
        message: "Password does not meet the required criteria!",
        result: {},
        error: 3,
      });
    }

    // Check if the email already exists
    const emailExists = await User.emailExists(body.email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: `Email ${body.email} already exists!`,
        result: {},
        error: 2,
      });
    }

    // Hash the password
    const hash_password = await Password.passwordHash(body.password);
    body.password = hash_password;

    body.role = "3";

    await User.createUser(body);
    return res.status(201).json({
      success: true,
      message: "User created successful!",
      result: {},
      error: 0,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      result: {},
      error: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const body = req.body;
    const id = req.user.id;

    // Validate the request body against the schema
    const { error, value } = Schema.userUpdateSchema.validate(body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body." + error.message,
        error: 1,
      });
    }

    if (body.email) {
      const emailExists = await User.emailExists(body.email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: `Email ${body.email} already exists!`,
          result: {},
          error: 2,
        });
      }
    }

     const result = await User.updateUser(id, body);
    if(result.rowCount===0){
      return res.status(404).json({
        message: 'INTERNAL SERVER ERROR:' + error.message,
        success: false,
        error: 3,
        result: {},
      })
    }

    return res.status(200).json({
      success: true,
      message: "User updated successful!",
      result: result.rowCount[0],
      error: 0,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error" + error.message,
      result: {},
      error: 4,
    });
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { error } = Schema.loginSchema.validate(req.body);
    if (error) {
      return passwordUtil.sendErrorResponse(
        res,
        422,
        "Invalid request body: " + error.message,
        1
      );
    }

    const user = await User.getUserByEmail(email);
    if (!user)
      return passwordUtil.sendErrorResponse(res, 400, "User Not Found!", 3);
    if (user.status === "suspended")
      return passwordUtil.sendErrorResponse(
        res,
        400,
        "You have been DEACTIVATED; contact admin!",
        2
      );

    if (!(await Password.verifyPassword(password, user.password))) {
      await passwordUtil.handleLoginAttempts(user.email);
      return passwordUtil.sendErrorResponse(res, 400, "Wrong Password!", 4);
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Extract information for session creation
    const expires_at = new Date(Date.now() + 60 * 60 * 1000); // Example: 1 hour expiry, adjust as needed
    const ip_address = req.headers["x-forwarded-for"] || req.ip; // Retrieves IP address
    const user_agent = req.headers["user-agent"]; // Retrieves user agent from request headers

    await updateLastLoginTime(user.email);
    // Create a session
    try {
      await createSession(user.id, token, expires_at, ip_address, user_agent);
    } catch (sessionError) {
      console.error("Error creating session:", sessionError);
      return passwordUtil.sendErrorResponse(
        res,
        500,
        "Failed to create session.",
        5
      );
    }

    delete user.password;

    return res.status(200).json({
      success: true,
      message: "User Logged In Successfully!",
      result: { token, user },
      error: 0,
    });
  } catch (err) {
    console.error("Error during login process:", err);
    return passwordUtil.sendErrorResponse(
      res,
      500,
      err.message || "Internal Server Error",
      8
    );
  }
};

const updateLastLoginTime = async (email) => {
  const now = new Date();
  await pool.query("UPDATE users SET last_login = $1 WHERE email = $2", [
    now,
    email,
  ]);
};

exports.logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return passwordUtil.sendErrorResponse(
        res,
        401,
        "Authorization token not found!",
        1
      );

    blacklistToken(token);
    return res.status(200).json({
      success: true,
      message: "User Logged Out Successfully!",
      result: {},
      error: 0,
    });
  } catch (err) {
    console.error("Error during logout process:", err);
    return passwordUtil.sendErrorResponse(
      res,
      500,
      err.message || "Internal Server Error",
      2
    );
  }
};
