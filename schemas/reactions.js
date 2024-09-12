const Joi = require('joi');

exports.createReaction = Joi.object({
reaction_type: Joi.string()
    .valid('like', 'dislike', 'love')
    .required()
});