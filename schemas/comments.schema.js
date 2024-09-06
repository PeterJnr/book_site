const Joi = require("joi");

exports.commentsCreateSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  email: Joi.string().max(50).optional(),
  comment_text: Joi.string().required(),
});