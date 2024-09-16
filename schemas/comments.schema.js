const Joi = require("joi");

exports.commentsCreate = Joi.object({
  comment: Joi.string().required(),
  parent_id: Joi.number().integer().optional().allow(null)  // Optional field for replies
});


exports.updateComment = Joi.object({
  comment: Joi.string().optional(),
});

