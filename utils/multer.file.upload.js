const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createMulterMiddleware = (storagePath) => {
  // Resolve the storage path to an absolute path
  const absoluteStoragePath = path.resolve(__dirname, storagePath);

  // Ensure the storage path exists
  if (!fs.existsSync(absoluteStoragePath)) {
    fs.mkdirSync(absoluteStoragePath, { recursive: true });
  }

  // Configure storage for multer
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, absoluteStoragePath); // Use the dynamic storage path
    },
    filename: function (req, file, cb) {
      console.log('file', file)
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext); // Append the current timestamp to the filename
    }
  });

  // File filter to accept only certain file types
  const fileFilter = (req, file, cb) => {
    console.log('file2', file)
    const allowedExtensions = /jpeg|jpg|png|gif|webp|svg/; // Common image file extensions
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedExtensions.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, WEBP, and SVG are allowed.'));
    }
  };

  // Create the multer instance with storage and file filter options
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
  });
};

// Usage example: 
const upload = createMulterMiddleware('../assets/images/books');

module.exports = upload;
