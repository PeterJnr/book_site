const { pool } = require("../services/pg_pool");

class Model {
  static async insert(tb_name, columns, column_values) {
    try {
      if (columns.length === 0 || column_values.length === 0) {
        throw new Error("Columns and values must not be empty");
      }

      if (columns.length !== column_values.length) {
        throw new Error("Columns and values length mismatch");
      }

      // Quote column names to handle reserved keywords
      const quotedColumns = columns.map((column) => `"${column}"`).join(", ");

      // Construct the INSERT query with dynamic columns and values
      const queryText = `INSERT INTO ${tb_name} (${quotedColumns}) VALUES (${column_values
        .map((_, index) => `$${index + 1}`)
        .join(", ")}) RETURNING *`;

      // Execute the query with the provided values and return the result
      return await pool.query(queryText, column_values);
    } catch (error) {
      console.error("Error inserting data:", error);
      throw new Error(error.message);
    }
  }

  static async fetch_all(tb_name, offset = 0, limit = 50) {
    try {
      const queryText = `SELECT * FROM ${tb_name} ORDER BY id DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

      // Return the result rows
      return await pool.query(queryText);
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error(error);
    }
  }

  static async fetch_one_by_key(tb_name, condition_key, condition_value) {
    try {
      const queryText = `SELECT * FROM ${tb_name} WHERE ${condition_key} = $1 LIMIT 1`;

      return await pool.query(queryText, [condition_value]);
    } catch (error) {
      console.error("Error selecting column by key:", error);
      return Promise.reject(error);
    }
  }

  static async update_by_id(tb_name, row_id, data) {
    try {
      // Extract keys and values from the data object
      const keys = Object.keys(data);
      const values = Object.values(data);

      // Construct the SET clause for the UPDATE query
      const setClause = keys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(", ");

      // Construct the UPDATE query
      const queryText = `UPDATE ${tb_name} SET ${setClause} WHERE id = $${
        keys.length + 1
      } RETURNING *`;

      // Add the row_id to the values array
      values.push(row_id);

      // Execute the query and return the result directly
      return await pool.query(queryText, values);
    } catch (error) {
      console.error("Error updating row:", error);
      return Promise.reject(error);
    }
  }

  static async select_by_keys(tb_name, conditions) {
    try {
      // Construct the WHERE clause with dynamic conditions
      const conditionKeys = Object.keys(conditions);
      const conditionValues = Object.values(conditions);

      const whereClause = conditionKeys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(" AND ");

      const queryText = `SELECT * FROM ${tb_name} WHERE ${whereClause}`;

      return await pool.query(queryText, conditionValues);
    } catch (error) {
      console.error("Error selecting data by key:", error);
      return Promise.reject(error);
    }
  }

  static async delete_by_key(tb_name, condition_key, condition_value) {
    try {
      const queryText = `
            DELETE FROM ${tb_name}
            WHERE ${condition_key} = $1
            RETURNING *
        `;

      return await pool.query(queryText, [condition_value]);
    } catch (error) {
      console.error("Error deleting data:", error);
      return Promise.reject(error);
    }
  }

  static async fetch_one_by_key1 (tb_name, key1, value1, key2, value2) {
  try {
    const queryText = `SELECT * FROM ${tb_name} WHERE ${key1} = $1 AND ${key2} = $2`;
    return await pool.query(queryText, [value1, value2]);
  } catch (error) {
    console.error("Error fetching data:", error);
    return Promise.reject(error);
  }
};

static async update_by_key1 (tb_name, key, value, data) {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const queryText = `UPDATE ${tb_name} SET ${setClause} WHERE ${key} = $${keys.length + 1} RETURNING *`;
    values.push(value);
    return await pool.query(queryText, values);
  } catch (error) {
    console.error("Error updating data:", error);
    return Promise.reject(error);
  }
};

static async delete_by_key1 (tb_name, key1, value1, key2, value2) {
  try {
    const queryText = `DELETE FROM ${tb_name} WHERE ${key1} = $1 AND ${key2} = $2 RETURNING *`;
    return await pool.query(queryText, [value1, value2]);
  } catch (error) {
    console.error("Error deleting data:", error);
    return Promise.reject(error);
  }
};

}

module.exports = Model;
