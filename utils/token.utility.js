const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// Generate Access Token
function generateAccessToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRATION_TIME });
}

// Generate Refresh Token
function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME });
}

const generateVerificationToken = async () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken
};
