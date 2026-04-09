const express = require('express');
const router = express.Router();
const {
  getAllDestinations,
  getDestinationByName,
  getHotelsByCity,
  createDestination,
  updateDestination
} = require('../controllers/destinationController');

router.route('/')
  .get(getAllDestinations)
  .post(createDestination);

// Hotels sub-route must come before /:name to avoid shadowing
router.get('/:name/hotels/:city', getHotelsByCity);

router.get('/:name', getDestinationByName);

// Use /:id for update since controller uses req.params.id (MongoDB ObjectId)
router.put('/:id', updateDestination);

module.exports = router;
