const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const {
    getStats,
    exportCSV,
    exportCatalog,
    importCatalog,
    getUsers,
    deleteUser,
    getDestinations,
    deleteDestination
} = require('../controllers/adminController');

// In-memory storage for CSV uploads (no disk write needed)
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

router.get('/stats', getStats);
router.get('/export', exportCSV);
router.get('/export/catalog', exportCatalog);
router.post('/import/catalog', csvUpload.single('csv'), importCatalog);

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

router.get('/destinations', getDestinations);
router.delete('/destinations/:id', deleteDestination);

module.exports = router;
