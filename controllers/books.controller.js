const Model = require("../models/queries.general");
const Schema = require("../schemas/books.schema");
const {
  handleFileUploads,
  handleUpdateFileUploads,
} = require("../utils/file.upload.utils");
const tb_name = "books";

exports.createBook = async (req, res) => {
  try {
    const body = req.body;

    // Validate the request body against the schema
    const { error, value } = Schema.bookCreateSchema.validate(body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body." + error.details,
        error: 1,
        result: {},
      });
    }

    const { cover_image } = value;

    let coverImagePath;
    if (cover_image) {
      try {
        coverImagePath = await handleFileUploads(
          req,
          res,
          ["cover_image"],
          `images/books/`
        );
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: "File upload error: " + uploadError.message,
          error: uploadError.message,
        });
      }
    }

    const keys = Object.keys(value);
    const values = Object.values(value);

    // Add cover image to the keys and values if it's provided
    if (cover_image) {
      keys.push("cover_image");
      values.push(coverImagePath);
    }

    // Create the book in the database
    const result = await Model.insert(tb_name, keys, values);

    return res.status(201).json({
      success: true,
      message: "Book uploaded successfully!",
      result: result.rows[0],
      error: 0,
    });
  } catch (error) {
    console.error("Error uploading Book:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: error.message,
    });
  }
};

exports.getAllBooks = async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 50;

    const result = await Model.fetch_all(tb_name, offset, limit);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No books found.",
        result: {},
        error: 1,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Books fetched successfully.",
      result: result.rows,
      error: 0,
    });
  } catch (error) {
    console.error("Error fetching books:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"+ error.message,
      result: {},
      error: 2,
    });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const bookId = req.params.id;

    const result = await Model.fetch_one_by_key(tb_name, "id", bookId);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "No record found!",
        success: false,
        result: {},
        error: 1,
      });
    }
    return res.status(200).json({
      message: "Book fetched successfully!",
      result: result.rows[0],
      error: 0,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching book by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      result: {},
      error: 2,
    });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id: bookId } = req.params;
    const body = req.body;

    const { error, value } = Schema.bookUpdateSchema.validate(body);
    if (error) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid request body: " +
          error.details.map((detail) => detail.message).join(", "),
        error: 1,
        result: {},
      });
    }

    const { cover_image, ...otherFields } = value;

    let coverImagePath;
    if (cover_image) {
      try {
        coverImagePath = await handleUpdateFileUploads(
          req,
          res,
          ["cover_image"],
          `images/books/`
        );
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: "File upload error: " + uploadError.message,
          error: 2,
          result: {},
        });
      }
    }
    const updateData = { ...otherFields };

    if (coverImagePath) {
      updateData.cover_image = coverImagePath;
    }

    const updatedBook = await Model.update_by_id("books", bookId, updateData);

    if (!updatedBook.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
        result: {},
        error: 3,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Book updated successfully!",
      result: updatedBook.rows[0],
      error: 0,
    });
  } catch (error) {
    console.error("Error updating Book:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 4,
    });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id: bookId } = req.params;

    const deletedBook = await Model.delete_by_key("books", "id", bookId);

    if (!deletedBook.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
        result: {},
        error: 1,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully!",
      result: deletedBook.rows[0],
      error: 0,
    });
  } catch (error) {
    console.error("Error deleting Book:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 2,
    });
  }
};
