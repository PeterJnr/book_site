const express = require("express");
const router = express.Router();
const Auth = require("../middlewares/auth.middleware");
const upload = require('../utils/multer.file.upload')
const BooksController = require('../controllers/books.controller')
const AdminController = require('../controllers/admin.controller');


// Create
router.post('/admin/create', Auth.isSuperAdmin, AdminController.createAdmin);
router.post('/admin/update/profile', Auth.isAdmin, AdminController.createAdmin);
// router.get('/book/:id', Auth.isSuperAdminOrAdmin, BooksController.getBookById);
// router.put('/book/update/:id', Auth.isSuperAdminOrAdmin, BooksController.updateBook);
// router.delete('/book/delete/:id', Auth.isSuperAdminOrAdmin, BooksController.deleteBook);

// Books
router.get('/books', Auth.isSuperAdminOrAdmin, BooksController.getAllBooks);
router.post('/book/create', Auth.isSuperAdminOrAdmin, upload.single('cover_image'), BooksController.createBook);
router.get('/book/:id', Auth.isSuperAdminOrAdmin, BooksController.getBookById);
router.put('/book/update/:id', Auth.isSuperAdminOrAdmin, BooksController.updateBook);
router.delete('/book/delete/:id', Auth.isSuperAdminOrAdmin, BooksController.deleteBook);

module.exports = router