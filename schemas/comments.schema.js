const Joi = require("joi");

exports.commentsCreate = Joi.object({
  comment: Joi.string().required(),
});

exports.updateComment = Joi.object({
  comment: Joi.string().optional(),
});