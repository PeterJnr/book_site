const { pool } = require("../services/pg_pool");
const Model = require('../models/user.model')
const base64 = require('base-64');
const { sendResetLink } = require('../models/mail.model')
const { generatePasswordResetToken } = require('../utils/password.utils')
const bcrypt = require("bcrypt");

class Password {
  static async passwordHash(password) {
    try {
      if (!password) {
        throw new Error("Password is required");
      }

      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);
      return hash;
    } catch (err) {
      console.error("Error in passwordHash function:", err);
      throw err;
    }
  }

  static async verifyPassword(password, hashedPassword) {
    try {
      // bcrypt.compare returns a boolean value directly
      return await bcrypt.compare(password, hashedPassword);
    } catch (err) {
      console.error("Error in verifyPassword function:", err);
      throw err;
    }
  }

  static async resetPassword(body, response) {
    try {
      // Generate the encrypted password reset token
      const hashedResetToken = await generatePasswordResetToken();

      // Update the user's remember_token field in the database
      const updateQuery =
        "UPDATE users SET remember_token = $1 WHERE email = $2";
      await pool.query(updateQuery, [hashedResetToken, body.email]);

      const userDetails = await Model.fetch_one_by_key(
        'users',
        "email",
        body.email
      );

      // Encode the token before sending it in the URL
      const encodedToken = base64.encode(hashedResetToken);


      await sendResetLink(userDetails.rows[0], encodedToken, response);

      response
        .status(200)
        .json({
          success: true,
          message: "Password reset link sent successfully!",
          result: {},
          error: 0,
        });
    } catch (error) {
      console.error("Error during password reset process:", error);
      response
        .status(500)
        .json({
          success: false,
          message: "Internal server error: " + error?.message,
          result: {},
          error: 3,
        });
    }
  }
}

module.exports = Password;
