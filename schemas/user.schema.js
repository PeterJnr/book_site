const Joi = require("joi");

exports.userCreateSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    "string.max": "Name must not exceed 100 characters.",
    "any.required": "Name is required.",
  }),
  user_name: Joi.string().max(50).required().messages({
    "string.max": "Username must not exceed 50 characters.",
    "any.required": "Username is required.",
  }),
  gender: Joi.string().valid("Male", "Female").required().messages({
    "any.only": 'Gender must be either "Male" or "Female".',
    "any.required": "Gender is required.",
  }),
  country: Joi.string().max(50).required().messages({
    "string.max": "Country must not exceed 50 characters.",
    "any.required": "Country is required.",
  }),
  phone: Joi.string().max(15).required().messages({
    "string.max": "Phone must not exceed 15 characters.",
    "any.required": "Phone is required.",
  }),
  email: Joi.string().email().max(100).required().messages({
    "string.email": "Email must be a valid email address.",
    "string.max": "Email must not exceed 100 characters.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long.",
    "any.required": "Password is required.",
  }),
});

exports.userUpdateSchema = Joi.object({
  name: Joi.string().max(100).optional().messages({
    "string.max": "Name must not exceed 100 characters.",
  }),
  user_name: Joi.string().max(50).optional().messages({
    "string.max": "Username must not exceed 50 characters.",
  }),
  gender: Joi.string().valid("male", "female").optional().messages({
    "any.only": 'Gender must be either "male" or "female".',
  }),
  country: Joi.string().max(50).optional().messages({
    "string.max": "Country must not exceed 50 characters.",
  }),
  avatar: Joi.string()
    .uri()
    .max(1000)
    .regex(/\.(jpeg|jpg|gif|png)$/i)
    .optional()
    .messages({
      "string.uri": "Avatar must be a valid URI.",
      "string.max": "Avatar URL must not exceed 1000 characters.",
      "string.pattern.base":
        "Avatar must be a valid image URL (jpeg, jpg, gif, png).",
    }),
  phone: Joi.string().max(15).optional().messages({
    "string.max": "Phone must not exceed 15 characters.",
  }),
  email: Joi.string().email().max(100).optional().messages({
    "string.email": "Email must be a valid email address.",
    "string.max": "Email must not exceed 100 characters.",
  }),
});


exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required.",
  }),
});
