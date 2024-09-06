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
                    (${requestBodyValues
                      .map((_, index) => "$" + (index + 1))
                      .join(", ")})
                RETURNING id`;

      const userResult = await client.query(insertUserQuery, requestBodyValues);

      if (userResult.rowCount === 0) {
        throw new Error("Error while creating user.");
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
                WHERE id = $${
                  requestBodyKeys.length + 1
                } RETURNING id`;

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
}

module.exports = User;
