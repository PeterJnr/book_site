const Joi = require("joi");

const bookCreateSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    "string.base": "Title must be a text.",
    "string.empty": "Title is required and cannot be empty.",
    "string.max": "Title must not exceed 255 characters.",
    "any.required": "Title is a required field.",
  }),
  author: Joi.string().max(255).required().messages({
    "string.base": "Author must be a text.",
    "string.empty": "Author is required and cannot be empty.",
    "string.max": "Author must not exceed 255 characters.",
    "any.required": "Author is a required field.",
  }),
  description: Joi.string().required().messages({
    "string.base": "Description must be a text.",
    "string.empty": "Description is required and cannot be empty.",
    "any.required": "Description is a required field.",
  }),
  price: Joi.number().precision(2).positive().required().messages({
    "number.base": "Price must be a number.",
    "number.positive": "Price must be a positive value.",
    "number.empty": "Price is required and cannot be empty.",
    "any.required": "Price is a required field.",
  }),
  published_date: Joi.date().optional().allow(null).messages({
    "date.base": "Published date must be a valid date format.",
  }),
  isbn: Joi.string().length(13).required().messages({
    "string.length": "ISBN must be exactly 13 characters long.",
    "any.required": "ISBN is a required field.",
  }),
  category: Joi.string().max(255).required().messages({
    "string.empty": "Category is required and cannot be empty.",
    "string.max": "Category must not exceed 255 characters.",
    "any.required": "Category is a required field.",
  }),
  stock_quantity: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Stock quantity must be a number.",
    "number.min": "Stock quantity cannot be negative.",
  }),
  cover_image: Joi.string()
    .max(1000)
    .optional()
    .allow("")
    .pattern(/\.(jpg|jpeg|png|gif|bmp)$/i)
    .messages({
      "string.max": "Cover image URL must not exceed 1000 characters.",
      "string.pattern.base":
        "Cover image must have a valid file extension (jpg, jpeg, png, gif, bmp).",
    }),
});

const bookUpdateSchema = Joi.object({
  title: Joi.string().max(255).optional().messages({
    "string.base": "Title must be a text.",
    "string.max": "Title must not exceed 255 characters.",
  }),
  author: Joi.string().max(255).optional().messages({
    "string.base": "Author must be a text.",
    "string.max": "Author must not exceed 255 characters.",
  }),
  description: Joi.string().optional().allow("").messages({
    "string.base": "Description must be a text.",
  }),
  price: Joi.number().precision(2).positive().optional().messages({
    "number.base": "Price must be a number.",
    "number.positive": "Price must be a positive value.",
  }),
  published_date: Joi.date().optional().allow(null).messages({
    "date.base": "Published date must be a valid date format.",
  }),
  isbn: Joi.string().length(13).optional().allow("").messages({
    "string.base": "ISBN must be a text.",
    "string.length": "ISBN must be exactly 13 characters long.",
  }),
  category: Joi.string().max(255).optional().allow("").messages({
    "string.base": "Category must be a text.",
    "string.max": "Category must not exceed 255 characters.",
  }),
  stock_quantity: Joi.number().integer().min(0).default(0).optional().messages({
    "number.base": "Stock quantity must be a number.",
    "number.integer": "Stock quantity must be an integer.",
    "number.min": "Stock quantity cannot be negative.",
  }),
  cover_image: Joi.string().max(255).optional().allow("").messages({
    "string.base": "Cover image must be a text.",
    "string.max": "Cover image URL must not exceed 255 characters.",
  }),
});

module.exports = {
  bookCreateSchema,
  bookUpdateSchema,
};
