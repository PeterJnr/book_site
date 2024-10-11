const { pool } = require("../services/pg_pool");

exports.createOtp = async (
  userId,
  otpCode,
  expiresAt,
  ip_address,
  device_info
) => {
  const query = `
      INSERT INTO otps (user_id, otp_code, expires_at, ip_address, device_info)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
  const result = await pool.query(query, [
    userId,
    otpCode,
    expiresAt,
    ip_address,
    device_info,
  ]);
  return result.rows[0];
};

exports.enableOtpForUser = async (userId) => {
  const query = `
      UPDATE users
      SET otp_enabled = TRUE
      WHERE id = $1
      RETURNING *;
    `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

exports.disableOtpForUser = async (userId) => {
  const query = `
      UPDATE users
      SET otp_enabled = FALSE
      WHERE id = $1
      RETURNING *;
    `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

exports.findActiveOtpByUserIdAndCode = async (userId, otpCode) => {
  const query = `
    SELECT * FROM otps
    WHERE user_id = $1 AND otp_code = $2 AND expires_at > NOW() AND verified = false;
  `;
  const result = await pool.query(query, [userId, otpCode]);
  return result.rows[0]; // Return the OTP record if found
};

exports.findActiveOtpByUserId = async (userId) => {
  const query = `
      SELECT *
      FROM otps
      WHERE user_id = $1
        AND expires_at > NOW()
        AND verified = FALSE
      LIMIT 1;
    `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

exports.verifyOtp = async (otpId) => {
  const query = `
    UPDATE otps
    SET verified = true
    WHERE id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [otpId]);
  return result.rows[0]; // Return the updated OTP record
};
