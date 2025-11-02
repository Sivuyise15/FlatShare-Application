// backend/routes/listing.routes.js - IMPROVED VERSION
const express = require("express");
const multer = require("multer");
const ListingController = require("../controller/listing.controller");

const router = express.Router();

// Improved multer configuration
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Add error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Your route - this creates POST /listings when mounted at /listings
router.post("/", upload.single("image"), handleMulterError, ListingController.createListing);

router.get("/", ListingController.getListings);

module.exports = router;
// Future routes: GET /, GET /:id, PUT /:id, DELETE /:id
