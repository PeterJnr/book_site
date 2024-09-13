const Model = require("../models/queries.general");
const Schema = require("../schemas/reactions");

tb_name = "reactions";

exports.createReaction = async (req, res) => {
  try {
    const { reaction_type } = req.body;
    const user_id = req.user.userId;
    const book_id = req.params.book_id;

    // Validate the input using Joi schema
    const { error, value } = Schema.createReaction.validate(
      { reaction_type },
      {
        abortEarly: true,
      }
    );
    if (error) {
      return res.status(400).json({
        success: false,
        message: `${error.details[0].message}`,
        error: 1,
        result: {},
      });
    }

    // Check if the user exists using the user_id
    const userExists = await Model.fetch_one_by_key("users", "id", user_id);
    if (userExists.rowCount === 0) {
      // User does not exist
      return res.status(404).json({
        success: false,
        message: "User not found.",
        error: 2,
        result: {},
      });
    }

    // Check if the book exists using the book_id
    const bookExists = await Model.fetch_one_by_key("books", "id", book_id);
    if (bookExists.rowCount === 0) {
      // Book does not exist
      return res.status(404).json({
        success: false,
        message: "Book not found.",
        error: 3,
        result: {},
      });
    }

    // Prepare keys and values for the insert operation
    const keys = ["user_id", "book_id", "reaction_type"];
    const values = [user_id, book_id, reaction_type];

    // Check if the user has already reacted to the book
    const existingReaction = await Model.fetch_one_by_key1(
      "reactions",
      "user_id",
      user_id,
      "book_id",
      book_id
    );

    if (existingReaction.rowCount > 0) {
      // User has already reacted
      const currentReactionType = existingReaction.rows[0].reaction_type;

      if (currentReactionType === reaction_type) {
        // If the new reaction is the same as the existing one, delete it
        await Model.delete_by_key(
          "reactions",
          "user_id",
          user_id,
          "book_id",
          book_id
        );
        return res.status(200).json({
          success: true,
          message: "Reaction removed.",
          result: {},
          error: 0,
        });
      } else {
        // Update the existing reaction to the new type
        await Model.update_by_key1("reactions", "user_id", user_id, {
          reaction_type,
        });
        return res.status(200).json({
          success: true,
          message: "Reaction updated.",
          result: {},
          error: 0,
        });
      }
    } else {
      // Insert a new reaction
      const result = await Model.insert("reactions", keys, values);

      if (result.rowCount === 0) {
        return res.status(500).json({
          message: "An error occurred while creating the reaction.",
          success: false,
          result: {},
          error: 4,
        });
      }

      return res.status(201).json({
        message: "Reaction Created Successfully",
        success: true,
        error: 0,
        result: result.rows[0],
      });
    }
  } catch (error) {
    console.error("Error creating reaction:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 5,
    });
  }
};

exports.updateReaction = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const reaction_id = req.params.reaction_id;
    const { reaction_type } = req.body;

    // Check if the book exists in the database
    const reactionExists = await Model.fetch_one_by_key(
      "reactions",
      "id",
      reaction_id,

    );
    if (reactionExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Reaction not found.",
        result: {},
        error: 1,
      });
    }

     // Check if the book exists in the database
     const userExists = await Model.fetch_one_by_key(
      "users",
      "id",
      user_id,      
    );
    if (userExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "user not found.",
        result: {},
        error: 2,
      });
    }

    // Validate reaction_type
    const { error, value } = Schema.createReaction.validate(
      { reaction_type },
      {
        abortEarly: true,
      }
    );

    if (error) {
      return res.status(400).json({
        success: false,
        message: `${error.details[0].message}`,
        error: 3,
        result: {},
      });
    }

    // Update the reaction
    const result = await Model.select_by_keys('reactions', { 'id': reaction_id, 'user_id': user_id });

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Reaction not found or could not be updated.",
        result: {},
        error: 4,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reaction updated successfully.",
      result: result.rows[0],
      error: 0,
    });
  } catch (error) {
    console.error("Error updating reaction:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 5,
    });
  }
};

exports.allReactionsOfABook = async (req, res) => {
  try {
    const book_id = req.params.book_id;

    const result = await Model.fetch_all_by_key(tb_name, 'book_id', book_id);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No record found",
        result: {},
        error: 1,
      });
    }

    return res.status(200).json({
      success: true,
      message: "reactions fetched successfully.",
      result: result.rows,
      error: 0,
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 3,
    });
  }
};

exports.deleteReaction = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const book_id = req.params.book_id;

    const bookExists = await Model.fetch_all_by_key(
      'books',
      "id",
      book_id
    );
    if (bookExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not Available .",
        result: {},
        error: 1,
      });
    }

    // Delete the reaction if it exists
    const result = await Model.delete_by_key('reactions','book_id', book_id);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Reaction not found.",
        result: {},
        error: 1,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reaction deleted successfully.",
      result: {},
      error: 0,
    });
  } catch (error) {
    console.error("Error deleting reaction:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
      result: {},
      error: 2,
    });
  }
};
