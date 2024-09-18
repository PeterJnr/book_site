// const Model = require("../models/queries.general");
const Schema = require("../schemas/admin");
const Mail = require("../models/mail.model");
const User = require("../models/user.model");
const token = require("../utils/token.utility");
const { passwordHash } = require("../models/password.model");
const Password = require("../utils/password.utils");

exports.createAdmin = async (req, res) => {
  try {
    const body = req.body;

    // Validate request body
    const { error, value } = Schema.adminCreate.validate(body, {
      abortEarly: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: `${error.details[0].message}`,
        error: 1,
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

    const newPassword = await Password.generatePassword();
    value.password = newPassword;

    // Hash the password
    const hash_password = await passwordHash(value.password);
    value.password = hash_password;

    // Generate verification token and send email
    const verificationToken = await token.generateVerificationToken();
    value.verification_token = verificationToken;
    value.role = "2"; // Assign role

    // Create the user in the database
    const result = await User.createUser(value);
    if (result) {
      if (value.email) {
        // Send verification email
        await Mail.adminSendVerificationEmail(
          value,
          verificationToken,
          newPassword
        );

        return res.status(200).json({
          success: true,
          message: "Please verify your email to complete your registration.",
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
