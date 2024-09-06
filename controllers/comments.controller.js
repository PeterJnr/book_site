const Model = require("../models/queries.general");
const Schema = require('../schemas/comments.schema')
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

exports.createComment = async (req, res) => {
  try {
    const body = req.body;
    const book_id = req.params.book_id;

    const {error, value } = Schema.commentsCreateSchema.validate(body);

    if( error) {
      return res.status(404).json({
        message: 'VALIDATION ERROR:' + error.message,
        success: false,
        result: {},
        error: 1,
      })
    }

    const keys = Object.keys(value);
    const values = Object.keys(value);




  }
};
