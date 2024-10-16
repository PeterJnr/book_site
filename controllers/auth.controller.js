const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const token = require("../utils/token.utility");
const { pool } = require("../services/pg_pool");
const Schema = require("../schemas/user.schema");
const Password = require("../models/password.model");
const passwordUtil = require("../utils/password.utils");
const { validatePassword } = require("../utils/validation.utils");
const { sendVerificationEmail } = require("../models/mail.model");
const { createSession } = require("../controllers/sessions.controller");

// Blacklist to store invalidated JWTs
const jwtBlacklist = new Set();

const blacklistToken = (token) => jwtBlacklist.add(token);

exports.createUser = async (req, res) => {
  try {
    const body = req.body;

    // Validate request body
    const { error, value } = Schema.userCreateSchema.validate(body, {
      abortEarly: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: `${error.details[0].message}`,
        error: 1,
      });
    }

    // Validate password criteria
    if (!validatePassword(body.password)) {
      return res.status(422).json({
        success: false,
        message: "Password does not meet the required criteria!",
        result: {},
        error: 2,
      });
    }

    // Check if email, username, or phone number already exists
    const emailExists = await User.emailExists(value.email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: `Email ${value.email} already exists!`,
        result: {},
        error: 3,
      });
    }

    const userNameExists = await User.alreadyExists(
      "user_name",
      value.user_name
    );
    if (userNameExists) {
      return res.status(409).json({
        success: false,
        message: `Username ${value.user_name} already exists!`,
        result: {},
        error: 4,
      });
    }

    const phoneExists = await User.alreadyExists("phone", value.phone);
    if (phoneExists) {
      return res.status(409).json({
        success: false,
        message: `Phone number ${value.phone} already exists!`,
        result: {},
        error: 5,
      });
    }

    // Hash the password
    const hash_password = await Password.passwordHash(value.password);
    value.password = hash_password;

    // Generate verification token and send email
    const verificationToken = await token.generateVerificationToken();
    value.verification_token = verificationToken;
    value.role = "3"; // Assign role

    // Create the user in the database
    const result = await User.createUser(value);
    if (result) {
      if (value.email) {
        // Send verification email
        await sendVerificationEmail(value, verificationToken);

        return res.status(200).json({
          success: true,
          message: "Please verify your email to comaplete your registration.",
          result: result,
          error: 0,
        });
      }
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 6,
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

    if (value.email) {
      const emailExists = await User.emailExists(value.email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: `Email ${value.email} already exists!`,
          result: {},
          error: 2,
        });
      }
    }

    const result = await User.updateUser(id, value);
    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "INTERNAL SERVER ERROR:" + error.message,
        success: false,
        error: 3,
        result: {},
      });
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
    if (!user) {
      // Check if the user object itself is null or undefined
      return res.status(400).json({
        message: "This user does not exist",
        success: false,
        error: 1,
      });
    }

    if (user.is_verified === false) {
      return res.status(403).json({
        success: false,
        message:
          "Email is not verified. Please check your email to complete your registration and then you can log in.",
        error: 2,
      });
    }

    if (!(await Password.verifyPassword(password, user.password))) {
      await passwordUtil.handleLoginAttempts(user.email);
      return passwordUtil.sendErrorResponse(res, 400, "Wrong Password!", 4);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Extract information for session creation
    const expires_at = new Date(Date.now() + 60 * 60 * 1000); 
    const ip_address = req.headers["x-forwarded-for"] || req.ip;
    const user_agent = req.headers["user-agent"];

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
