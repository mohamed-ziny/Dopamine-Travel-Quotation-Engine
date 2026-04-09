const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'public/uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
});

const {
  getAllQuotations,
  getQuotationById,
  getQuotationByRefId,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  getQuotationStats,
  copyQuotation,
  uploadPhotos
} = require('../controllers/quotationController');

// Main routes
router.route('/')
  .get(getAllQuotations)
  .post(createQuotation);

// Stats route
router.get('/stats/summary', getQuotationStats);

// Reference ID lookup
router.get('/ref/:refId', getQuotationByRefId);

// Single quotation routes
router.route('/:id')
  .get(getQuotationById)
  .put(updateQuotation)
  .delete(deleteQuotation);

// Status update
router.patch('/:id/status', updateQuotationStatus);

// Copy quotation
router.post('/:id/copy', copyQuotation);

// Upload photos
router.post('/:id/photos', upload.array('photos', 5), uploadPhotos);
// Generic upload (returns paths to attach to specific items)
router.post('/upload', upload.array('photos', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  const filePaths = req.files.map(file => `/uploads/${file.filename}`);
  res.status(200).json({ success: true, data: filePaths });
});

module.exports = router;

