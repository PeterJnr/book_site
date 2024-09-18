const express = require("express");
const router = express.Router();
const CommentsController = require('../controllers/comments.controller')
const Auth = require("../middlewares/auth.middleware")
const ReactionsController = require('../controllers/reactions.controller')

// comments (First route for getting all comments is for admin(s) only)..
router.post('/comment/create/:book_id', Auth.isAuthenticated, CommentsController.createComment);
router.get('/comments/:book_id', Auth.isAuthenticated, CommentsController.allCommentOfABook);
router.get('/comment/user', Auth.isAuthenticated, CommentsController.getAUserComment);
router.put('/comment/update/:comment_id', Auth.isAuthenticated, CommentsController.updateComment);
router.delete('/comment/delete/:id', Auth.isAuthenticated, CommentsController.deleteComment);

// Reactions (First route for getting all reactions is for admin(s) only)..
router.get('/reactions/:book_id', Auth.isSuperAdminOrAdmin, ReactionsController.allReactionsOfABook);
router.post('/reaction/create/:book_id', Auth.isAuthenticated, ReactionsController.createReaction);
router.put('/reaction/update/:reaction_id', Auth.isAuthenticated, ReactionsController.updateReaction);
router.delete('/reaction/delete/:book_id', Auth.isAuthenticated, ReactionsController.deleteReaction);
// router.get('/reactions/:reactions_id', ReactionsController.getAReactions);
// router.get('/reactions/:book_id', ReactionsController.getReactionsByBook);

module.exports = router;