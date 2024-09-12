const { response } = require("express");
const Model = require("../models/queries.general");
const Schema = require("../schemas/books.schema");
const tb_name = "books";

exports.createBook = async (req, res) => {
  try {
    const body = req.body;
    console.log('body', body)

    const { error, value } = Schema.bookCreateSchema.validate(body, {
      abortEarly: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: `${error.details[0].message}`,
        error: 1,
        result: {},
      });
    }

    const { isbn, title, author } = value;
    const isbnExist = await Model.fetch_one_by_key(tb_name, "isbn", isbn);
    if (isbnExist.rowCount > 0) {
      return res.status(400).json({
        message: `A book with ISBN ${isbn} already exists.`,
        success: false,
        result: {},
        error: 2,
      });
    }

    const duplicateBook = await Model.select_by_keys("books", {
      title,
      author,
    });
    if (duplicateBook.rowCount > 0) {
      return res.status(400).json({
        message: `A book with title "${title}" by author "${author}" already exists.`,
        success: false,
        result: {},
        error: 3,
      });
    }

    const coverImagePath = req.file ? req.file.path : null; // Store the image path if it exists

    // Include coverImagePath in the values to be inserted
    const keys = Object.keys(value).concat('cover_image');
    const values = Object.values(value).concat(coverImagePath);

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
      message: "Internal server error" + error.message,
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

    const { error, value } = Schema.bookUpdateSchema.validate(body, {
      abortEarly: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: `${error.details[0].message}`,
        error: 1,
        result: {},
      });
    }

    const { isbn, author, title } = value;

    const duplicateBook = await Model.select_by_keys("books", {
      title,
      author,
    });
    if (duplicateBook.rowCount > 0 && duplicateBook.rows[0].id !== bookId) {
      return res.status(400).json({
        message: `A book with title "${title}" by author "${author}" already exists.`,
        success: false,
        result: {},
        error: 2,
      });
    }

    const isbnExist = await Model.fetch_one_by_key("books", "isbn", isbn);
    if (isbnExist.rowCount > 0 && isbnExist.rows[0].id !== bookId) {
      return res.status(400).json({
        message: `A book with ISBN ${isbn} already exists.`,
        success: false,
        result: {},
        error: 3,
      });
    }

    const updatedBook = await Model.update_by_id("books", bookId, value);

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

    const result = await Model.fetch_one_by_key(tb_name, "id", bookId);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "No record found!",
        success: false,
        result: {},
        error: 1,
      });
    }

    const deletedBook = await Model.delete_by_key("books", "id", bookId);

    if (deletedBook.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
        result: {},
        error: 2,
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
      error: 3,
    });
  }
};
