const User = require("../models/user.model");
const { pool } = require("../services/pg_pool");
const Password = require("../models/password.model");
const { isValidEmail } = require("../utils/validation.utils");

exports.resetPassword = async (request, response) => {
  const body = request.body;

  const email = ["email"];
  const isValidRequest = email.every((key) => {
    return (
      body[key] && typeof body[key] === "string" && isValidEmail(body[key])
    );
  });

  if (!isValidRequest) {
    response.status(422).json({
      success: false,
      message: "Invalid request body!",
      result: {},
      error: 1,
    });
  }

  const checkEmail = await User.emailExists(body.email);
  if (!checkEmail) {
    response.status(400).json({
      success: false,
      message: `Email ${body.email} is NOT found in our Records; Register!`,
      result: {},
      error: 2,
    });
  }

  Password.resetPassword(body, response);
};

exports.verifyForgotPassword = async (request, response) => {
  const { token, password } = request.body;

  // Validate request body
  if (!token || !password) {
    return response.status(422).json({
      success: false,
      message: "Incomplete fields!",
      result: {},
      error: 1,
    });
  }

  try {
    // Decode the base64 encoded token
    const decodedToken = Buffer.from(token, "base64").toString("utf-8");

    // Check if the provided token exists in the database
    const tokenCheckQuery =
      "SELECT id, email, password FROM users WHERE remember_token = $1";
    const tokenCheckResult = await pool.query(tokenCheckQuery, [decodedToken]);

    if (tokenCheckResult.rowCount === 0) {
      return response.status(400).json({
        success: false,
        message: "Invalid token!",
        result: {},
        error: 2,
      });
    }

    const {
      id: userId,
      email,
      password: currentPasswordHash,
    } = tokenCheckResult.rows[0];

    // Validate the new password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return response.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character!",
        result: {},
        error: 6,
      });
    }

    // Hash the new password
    const hash_password = await Password.passwordHash(password);

    // Check if the new password is the same as the current password
    const passwordMatch = await Password.verifyPassword(
      password,
      currentPasswordHash
    );

    if (passwordMatch) {
      return response.status(400).json({
        success: false,
        message: "New password must be different from the current password!",
        result: {},
        error: 7,
      });
    }

    // Update the user's password in the database
    const updateQuery =
      "UPDATE users SET password = $1, remember_token = NULL WHERE id = $2";
    await pool.query(updateQuery, [hash_password, userId]);

    return response.status(200).json({
      success: true,
      message: "Password reset successfully",
      result: {},
      error: 0,
    });
  } catch (error) {
    console.error("Error during password reset process:", error);
    return response.status(500).json({
      success: false,
      message: "Internal server error",
      result: {},
      error: 3,
    });
  }
};
