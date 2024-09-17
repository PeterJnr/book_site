const { id } = require("date-fns/locale");
const Model = require("../models/queries.general");
const Schema = require("../schemas/comments.schema");
const Comment = require("../models/comment.model");
const tb_name = "comments";

exports.getAUserComment = async (req, res) => {
  try {
    const user_id = req.user.userId;

    const userExists = await Model.fetch_all_by_key('users', 'id', user_id)
    if (userExists.rowCount === 0) {
      return res.status(400).json({
        message: 'User not found!',
        result: {},
        success: false,
        error: 1,
      });
    }

    // Call the static function to fetch comments and replies for the user
    const result = await Comment.fetch_one_by_key(
      "comments",
      "user_id",
      user_id
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No comments found.",
        result: {},
        error: 2,
      });
    }

    // Function to nest replies under their parent comments
    const nestComments = (comments) => {
      const commentMap = {};

      // Organize comments by their ID for easy lookup
      comments.forEach((comment) => {
        comment.replies = []; // Add a replies field to each comment
        commentMap[comment.id] = comment;
      });

      const nestedComments = [];

      // Nest replies under their parent comments
      comments.forEach((comment) => {
        if (comment.parent_id) {
          commentMap[comment.parent_id].replies.push(comment); // Attach as a reply
        } else {
          nestedComments.push(comment); // Top-level comments
        }
      });

      return nestedComments;
    };

    const nestedComments = nestComments(result.rows);

    return res.status(200).json({
      success: true,
      message: "Comment fetched successfully.",
      result: nestedComments, // Return the nested comments
      error: 3,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 4,
    });
  }
};

exports.allCommentOfABook = async (req, res) => {
  try {
    const book_id = req.params.book_id;

    const bookExist = await Model.fetch_all_by_key("books", "id", book_id);
    if (bookExist.rowCount === 0) {
      return res.status(400).json({
        message: "Record not found!",
        success: false,
        result: {},
        error: 1,
      });
    }

    // Fetch comments using the model
    const result = await Comment.fetchCommentsByBook(book_id);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No comments found.",
        result: {},
        error: 2,
      });
    }

    // Helper function to nest comments
    const nestComments = (comments, parentId = null) => {
      return comments
        .filter((comment) => comment.parent_id === parentId)
        .map((comment) => ({
          ...comment,
          replies: nestComments(comments, comment.id), // Recursively get replies
        }));
    };

    // Nest the comments
    const nestedComments = nestComments(result.rows);

    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully.",
      result: nestedComments, // Return the nested comments
      error: 0,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 3,
    });
  }
};

exports.createComment = async (req, res) => {
  try {
    const body = req.body;
    const book_book_id = req.params.book_id;
    const user_id = req.user.userId;

    // Validate the incoming request data using Joi schema
    const { error, value } = Schema.addComment.validate(body);

    if (error) {
      return res.status(400).json({
        message: "VALIDATION ERROR: " + error.message,
        success: false,
        result: {},
        error: 1,
      });
    }

    // Check if the book exists in the database
    const bookExist = await Model.fetch_one_by_key("books", "id", book_id);
    if (bookExist.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
        result: {},
        error: 2,
      });
    }

    // Check if parent_id is provided and valid (for replies)
    if (value.parent_id) {
      const parentCommentExist = await Model.fetch_one_by_key(
        "comments",
        "id",
        value.parent_id
      );
      if (parentCommentExist.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found.",
          result: {},
          error: 3,
        });
      }
    }

    // Prepare the data for insertion
    const keys = Object.keys(value); // Includes fields like 'comment', 'parent_id'
    const values = Object.values(value);

    // Add book_id and user_id to the comment data
    keys.push("book_id", "user_id");
    values.push(book_id, user_id);

    // Insert the comment into the database
    const result = await Model.insert("comments", keys, values);

    if (result.rowCount > 0) {
      return res.status(201).json({
        message: "Comment created successfully!",
        success: true,
        result: result.rows[0],
        error: 0,
      });
    }

    return res.status(500).json({
      message: "Failed to create comment.",
      success: false,
      result: {},
      error: 4,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      result: {},
      error: 5,
    });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const body = req.body;
    const { comment_id } = req.params;

    const { error, value } = Schema.updateComment.validate(body);
    if (error) {
      return res.status(404).json({
        message: "VALIDATION ERROR:" + error.message,
        success: false,
        result: {},
        error: 1,
      });
    }

    commentExist = await Model.fetch_one_by_key(tb_name, "id", comment_id);
    if (commentExist.rowCount === 0) {
      return res.status(404).json({
        message: "Comment not found!",
        success: false,
        result: {},
        error: 2,
      });
    }

    const result = await Model.update_by_id(tb_name, comment_id, value);
    if (result.rowCount === 0) {
      return res.status(500).json({
        message: "An error occured",
        success: false,
        error: 3,
        result: {},
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment Updated Succesfully!",
      result: result.rows[0],
      error: 4,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      result: {},
      error: 5,
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment_id = req.params.id;

    const commentExists = await Model.fetch_one_by_key(
      tb_name,
      "id",
      comment_id
    );
    if (commentExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No Comment found.",
        result: {},
        error: 1,
      });
    }

    const result = await Model.delete_by_key(tb_name, "id", comment_id);
    if (result.rowCount > 0) {
      return res.status(200).json({
        message: "Comment Deleted Successfully",
        success: true,
        result: result.rows[0],
        error: 0,
      });
    }

    return res.status(500).json({
      message: "Failed to delete comment.",
      success: false,
      result: {},
      error: 2,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 3,
    });
  }
};
