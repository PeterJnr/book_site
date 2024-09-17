const { pool } = require("../services/pg_pool");

class Comment {
  static async addComment(book_id, user_id, comment, parent_id = null) {
    try {
      const query = `
            INSERT INTO comments (book_id, user_id, comment, parent_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `;
      const values = [book_id, user_id, comment, parent_id];

      // Execute the query and return the inserted comment
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error; // Propagate the error to handle it in the calling function
    }
  }

  static async fetchCommentsByBook(book_id) {
    try {
      const query = `
            WITH RECURSIVE comment_hierarchy AS (
                -- Fetch all root comments for a specific book
                SELECT id, book_id, user_id, comment, parent_id, created_at, updated_at
                FROM comments
                WHERE book_id = $1 AND parent_id IS NULL  -- Root comments (no parent)

                UNION ALL

                -- Recursively fetch replies for each comment
                SELECT c.id, c.book_id, c.user_id, c.comment, c.parent_id, c.created_at, c.updated_at
                FROM comments c
                INNER JOIN comment_hierarchy ch ON c.parent_id = ch.id  -- Fetch child comments
            )
            SELECT * FROM comment_hierarchy;
        `;

      const values = [book_id];

      // Execute the query to fetch all comments and their replies for the book
      const result = await pool.query(query, values);

      return result; // Return the raw result to be formatted in the controller
    } catch (error) {
      console.error("Error fetching comments by book:", error);
      throw new Error("Failed to fetch comments for the book.");
    }
  }

  static async fetch_one_by_key(tb_name, condition_key, condition_value) {
    try {
      const query = `
        WITH RECURSIVE comment_tree AS (
          SELECT 
            id, 
            book_id, 
            user_id, 
            comment, 
            parent_id, 
            created_at, 
            updated_at
          FROM ${tb_name}
          WHERE ${condition_key} = $1
          AND parent_id IS NULL -- Fetch top-level comments only

          UNION ALL

          SELECT 
            c.id, 
            c.book_id, 
            c.user_id, 
            c.comment, 
            c.parent_id, 
            c.created_at, 
            c.updated_at
          FROM ${tb_name} c
          INNER JOIN comment_tree ct ON ct.id = c.parent_id -- Join to get replies
        )
        SELECT * FROM comment_tree;
      `;

      const result = await pool.query(query, [condition_value]);
      return result;
    } catch (error) {
      console.error("Error fetching comment by key:", error);
      throw error;
    }
  }
}

module.exports = Comment;
