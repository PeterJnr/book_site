const express = require("express");
const router = express.Router();
const upload = require('../utils/multer.file.upload')
const BooksController = require('../controllers/books.controller')
const CommentsController = require('../controllers/comments.controller')
const Auth = require("../middlewares/auth.middleware")
const ReactionsController = require('../controllers/reactions.controller')


// const storagePath = '../assets/books/images';
// const upload = createMulterMiddleware(storagePath);
// Books
router.get('/books', BooksController.getAllBooks);
router.post('/book/create', upload.single('cover_image'), BooksController.createBook);
router.get('/book/:id', BooksController.getBookById);
router.put('/book/update/:id', BooksController.updateBook);
router.delete('/book/delete/:id', BooksController.deleteBook);


// comments (First route for getting all comments is for admin(s) only)..
router.get('/comments', CommentsController.allComments);
router.post('/comment/create/:book_id', Auth.isAuthenticated, CommentsController.createComment);
router.get('/comment/comment_id', Auth.isAuthenticated, CommentsController.getAUsersComment);
router.get('/comment/:book_id', Auth.isAuthenticated, CommentsController.getCommentByBook);
router.put('/comment/update/:comment_id', Auth.isAuthenticated, CommentsController.updateComment);
router.delete('/comment/delete/:id', Auth.isAuthenticated, CommentsController.deleteComment);

// Reactions (First route for getting all reactions is for admin(s) only)..
router.get('/reactions/:book_id', Auth.isAuthenticated, ReactionsController.allReactionsOfABook);
router.post('/reaction/create/:book_id', Auth.isAuthenticated, ReactionsController.createReaction);
router.delete('/reaction/delete/:reaction_id', Auth.isAuthenticated, ReactionsController.deleteReaction);
router.put('/reaction/update/:reaction_id', Auth.isAuthenticated, ReactionsController.updateReaction);
// router.get('/reactions/:reactions_id', ReactionsController.getAReactions);
// router.get('/reactions/:book_id', ReactionsController.getReactionsByBook);

module.exports = router;