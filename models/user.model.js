const { pool } = require("../services/pg_pool");
const bcrypt = require("bcrypt");

const TABLE_NAME = "users";

class User {
  static async createUser(body) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const requestBodyKeys = Object.keys(body);
      const requestBodyValues = Object.values(body);

      const insertUserQuery = `
        INSERT INTO ${TABLE_NAME} 
        (${requestBodyKeys.join(", ")}) 
        VALUES 
        (${requestBodyValues.map((_, index) => "$" + (index + 1)).join(", ")})
        RETURNING *`;

      const userResult = await client.query(insertUserQuery, requestBodyValues);

      if (userResult.rowCount === 0) {
        throw new Error("Error while creating user.");
      }

      // Extract the user data from the result
      const user = userResult.rows[0];

      // Delete the password field from the user object
      delete user.password;

      await client.query("COMMIT");

      return user; // Return the user object without the password field
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Internal Server Error:", error);
      throw new Error(`Internal Server Error: ${error.message}`);
    } finally {
      client.release();
    }
  }

  static async emailExists(email) {
    try {
      const data = await pool.query("SELECT * FROM users WHERE email=$1", [
        email,
      ]);
      return data.rowCount > 0;
    } catch (error) {
      console.error("Error in emailExists function:", error);
      throw new Error("Internal server error");
    }
  }

  static async getUserByEmail(email) {
    try {
      const queryText = `SELECT * FROM users WHERE email = $1`;
      const result = await pool.query(queryText, [email]);

      return result.rows[0];
    } catch (error) {
      console.error("Error selecting user by email:", error);
      throw error;
    }
  }

  static async updateUser(id, body) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const requestBodyKeys = Object.keys(body);
      const requestBodyValues = Object.values(body);

      // Construct SET clause for the UPDATE query
      const setClause = requestBodyKeys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(", ");

      const updateUserQuery = `
                UPDATE ${TABLE_NAME} 
                SET ${setClause} 
                WHERE id = $${requestBodyKeys.length + 1} RETURNING id`;

      const userResult = await client.query(updateUserQuery, [
        ...requestBodyValues,
        id,
      ]);

      if (userResult.rowCount === 0) {
        throw new Error("Error while updating user.");
      }

      await client.query("COMMIT");
      return { id: userResult.rows[0].id };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Internal Server Error:", error);
      throw new Error(`Internal Server Error: ${error.message}`);
    } finally {
      client.release();
    }
  }

  static async fetch_one_by_key(tb_name, condition_key, condition_value) {
    try {
      // Construct the SELECT query with dynamic column and condition
      const queryText = `SELECT * FROM ${tb_name} WHERE ${condition_key} = $1 LIMIT 1`;

      // Execute the query with the provided condition value and return the result
      return await pool.query(queryText, [condition_value]);
    } catch (error) {
      console.error("Error selecting column by key:", error);
      return Promise.reject(error);
    }
  }

  static async alreadyExists(fieldName, value) {
    try {
      // Construct the query dynamically
      const query = `SELECT 1 FROM users WHERE ${fieldName} = $1 LIMIT 1`;
      const result = await pool.query(query, [value]);

      return result.rowCount > 0; // Returns true if the field value exists
    } catch (error) {
      console.error(`Error checking if ${fieldName} exists:`, error.message);
      throw new Error(`Error checking if ${fieldName} exists in the database.`);
    }
  }

  static async findByVerificationToken(token) {
    const query = `SELECT * FROM users WHERE verification_token = $1`;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async verifyUserEmail(userId) {
    const query = `
      UPDATE users
      SET is_verified = TRUE,
          verification_token = NULL,
          status = 'active'
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [userId]);
    return result;
  }
}

module.exports = User;
