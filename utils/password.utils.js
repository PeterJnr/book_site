const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { pool } = require("../services/pg_pool");
const User = require("../models/user.model");

const completeLogin = async (req, res, user, otpVerified = false) => {
  delete user.password;
  const accessToken = jwt.sign(user, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: process.env.TOKEN_EXPIRATION_TIME,
  });

  await updateLastLoginTime(user.email);
  await createSession(req, user.id, accessToken);

  return res.status(200).json({
    success: true,
    message: "User Logged In Successfully!",
    result: { token: accessToken, user },
    error: 0,
  });
};

const handleLoginAttempts = async (email) => {
  const user = await User.getUserByEmail(email);
  if (!user) throw new Error("User not found");

  const { login_attempts, last_login_attempt } = user;
  const now = new Date();

  if (login_attempts >= 5 && now - last_login_attempt < 1 * 60 * 1000) {
    throw new Error("You have to wait for a minute before you can try again.");
  }

  await pool.query(
    "UPDATE users SET last_login_attempt = $1 WHERE email = $2",
    [now, email]
  );

  if (login_attempts >= 5) {
    await resetLoginAttempts(email);
    throw new Error("You have to wait for a minute before you can try again.");
  } else {
    await updateLoginAttempts(email, login_attempts + 1);
    throw new Error(
      `Incorrect login details, you have ${5 - login_attempts} attempts left.`
    );
  }
};

const enforceLoginCooldown = async (email) => {
  const result = await pool.query(
    "SELECT last_login_attempt FROM users WHERE email = $1",
    [email]
  );
  const lastLoginAttempt = result.rows[0]?.last_login_attempt
    ? new Date(result.rows[0].last_login_attempt)
    : null;
  const now = new Date();

  if (lastLoginAttempt && now - lastLoginAttempt < 1 * 60 * 1000) {
    throw new Error("You have to wait for a minute before you can try again.");
  }
};

const resetLoginAttempts = async (email) => {
  await pool.query("UPDATE users SET login_attempts = 0 WHERE email = $1", [
    email,
  ]);
};

const updateLoginAttempts = async (email, attempts) => {
  await pool.query("UPDATE users SET login_attempts = $1 WHERE email = $2", [
    attempts,
    email,
  ]);
};

const updateLastLoginTime = async (email) => {
  const now = new Date();
  await pool.query("UPDATE users SET last_login = $1 WHERE email = $2", [
    now,
    email,
  ]);
};

const sendErrorResponse = (res, statusCode, message, errorCode = 0) => {
  return res.status(statusCode).json({
    success: false,
    message,
    result: {},
    error: errorCode,
  });
};

const generatePasswordResetToken = async () => {
  const length = 10;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";
  const charactersLength = characters.length;

  let token = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charactersLength);
    token += characters[randomIndex];
  }

  const encryptedToken = await bcrypt.hash(token, 10);
  return encryptedToken;
};

// Function to generate a random password
const generatePassword = (length = 10) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length); // Get a random index
    password += charset[randomIndex]; // Append the character at that index
  }

  return password;
};

const newPassword = generatePassword();

module.exports = {
  completeLogin,
  handleLoginAttempts,
  enforceLoginCooldown,
  resetLoginAttempts,
  updateLoginAttempts,
  updateLastLoginTime,
  sendErrorResponse,
  generatePasswordResetToken,
  generatePassword,
};
