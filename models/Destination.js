const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Destination name is required'],
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  cities: [{
    type: String,
    trim: true
  }],
  hotels: [{
    city: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    roomTypes: [{
      type: String,
      trim: true
    }],
    basePrice: {
      type: Number,
      min: 0
    }
  }],
  cityServices: [{
    city: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      default: 'Other',
      trim: true
    },
    rate: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster city lookups
destinationSchema.index({ 'hotels.city': 1 });

const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;
