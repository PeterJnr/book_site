const { id } = require("date-fns/locale");
const Model = require("../models/queries.general");
const Schema = require("../schemas/comments.schema");
const { response } = require("express");
const tb_name = "comments";

exports.allComments = async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 50;

    const result = await Model.fetch_all(tb_name, offset, limit);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No comments found.",
        result: {},
        error: 1,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully.",
      result: result.rows,
      error: 0,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error" + error.message,
      result: {},
      error: 2,
    });
  }
};

exports.getAUsersComment = async (req, res) => {
  try {
    const Id = req.params.comment_id;
    const user_id = req.user.userId;

    const commentExist = await Model.fetch_one_by_key(tb_name, 'id', Id)
    if (commentExist.rowCount === 0) {
      return res.status(404).json({
        message: 'Record not found',
        success: false,
        error: 1,
        result: {},
      })
    }

    const result = await Model.fetch_one_by_key(tb_name, "user_id", user_id);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No comments found.",
        result: {},
        error: 1,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Comment fetched successfully.",
      result: result.rows[0],
      error: 0,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error" + error.message,
      result: {},
      error: 2,
    });
  }
};

exports.getCommentByBook = async (req, res) => {
  try {
    const Id = req.params.book_id;

    const result = await Model.fetch_one_by_key(tb_name, "id", Id);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No comments found.",
        result: {},
        error: 1,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment fetched successfully.",
      result: result.rows[0],
      error: 0,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error" + error.message,
      result: {},
      error: 2,
    });
  }
};

exports.createComment = async (req, res) => {
  try {
    const body = req.body;
    const book_id = req.params.book_id;
    const user_id = req.user.userId;

    const { error, value } = Schema.commentsCreate.validate(body);

    if (error) {
      return res.status(404).json({
        message: "VALIDATION ERROR:" + error.message,
        success: false,
        result: {},
        error: 1,
      });
    }

    const bookExist = await Model.fetch_one_by_key("books", "id", book_id);

    if (bookExist.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
        result: {},
        error: 2,
      });
    }

    const keys = Object.keys(value);
    const values = Object.values(value);

    keys.push("book_id", "user_id");
    values.push(book_id, user_id);

    const result = await Model.insert(tb_name, keys, values);

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
      error: 3,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      result: {},
      error: 4,
    });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const body = req.body;
    const {comment_id} = req.params;

    const { error, value } = Schema.updateComment.validate(body);
    if (error) {
      return res.status(404).json({
        message: "VALIDATION ERROR:" + error.message,
        success: false,
        result: {},
        error: 1,
      });
    }

    commentExist = await Model.fetch_one_by_key(tb_name, 'id', comment_id)
    if (commentExist.rowCount === 0) {
      return res.status(404).json({
        message: 'Record not found!',
        success: false,
        result: {},
        error: 2,
      })
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
        message: "No record found.",
        result: {},
        error: 1,
      });
    }

    const result = await Model.delete_by_key(tb_name, "id", comment_id); // Corrected column name to "id"
    if (result.rowCount > 0) {
      return res.status(200).json({
        message: "Deleted Successfully",
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
