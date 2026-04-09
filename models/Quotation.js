const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  hotel: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  checkIn: {
    type: Date,
    required: [true, 'Check-in date is required']
  },
  nights: {
    type: Number,
    required: [true, 'Number of nights is required'],
    min: [1, 'At least 1 night required']
  },
  checkOut: {
    type: Date
  },
  roomType: {
    type: String,
    required: [true, 'Room type is required'],
    trim: true
  },
  rooms: {
    type: Number,
    min: [1, 'At least 1 room required'],
    default: 1
  },
  mealPlan: {
    type: String,
    enum: ['RO', 'BB', 'HB', 'FB', 'AI', 'Iftar', 'Suhur'],
    default: 'RO'
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative']
  },
  cancellationPolicy: {
    type: String,
    trim: true,
    default: 'Non-refundable'
  },
  photos: {
    type: [String],
    default: []
  }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'AirportTransfer',
      'DayTour',
      'HotelTransfer',
      'TourGuide',
      'Visa',
      'CarRental',
      'Other'
    ],
    required: [true, 'Service type is required']
  },
  // Which day of the itinerary this service belongs to (1-based)
  day: {
    type: Number,
    default: null
  },
  details: {
    type: String,
    trim: true,
    default: ''
  },
  // For transfers: source and destination text
  source: {
    type: String,
    trim: true,
    default: ''
  },
  destination: {
    type: String,
    trim: true,
    default: ''
  },
  // Car type (auto-set from pax: 1-2=Sedan, 3-6=Van, 7+=Sprinter, editable)
  carType: {
    type: String,
    trim: true,
    default: ''
  },
  // Time fields
  pickupTime: {
    type: String,
    trim: true,
    default: ''
  },
  startTime: {
    type: String,
    trim: true,
    default: ''
  },
  dropoffTime: {
    type: String,
    trim: true,
    default: ''
  },
  // Location fields (for car rental)
  pickupLocation: {
    type: String,
    trim: true,
    default: ''
  },
  dropoffLocation: {
    type: String,
    trim: true,
    default: ''
  },
  // Duration (for day tours, tour guides)
  duration: {
    type: String,
    trim: true,
    default: ''
  },
  pax: {
    type: Number,
    min: [0, 'Pax cannot be negative'],
    default: 1
  },
  rate: {
    type: Number,
    min: [0, 'Rate cannot be negative'],
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  photos: {
    type: [String],
    default: []
  }
}, { _id: false });

const quotationSchema = new mongoose.Schema({
  refId: {
    type: String,
    required: [true, 'Reference ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
    index: true
  },
  dates: {
    start: {
      type: Date,
      required: [true, 'Start date is required']
    },
    end: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (value) {
          return value > this.dates.start;
        },
        message: 'End date must be after start date'
      }
    },
    nights: {
      type: Number,
      required: true,
      min: [1, 'At least 1 night required']
    }
  },
  pax: {
    adults: {
      type: Number,
      required: [true, 'Number of adults is required'],
      min: [1, 'At least 1 adult required'],
      default: 1
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Children cannot be negative']
    },
    childrenAges: {
      type: [Number],
      default: []
    }
  },
  userName: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    index: true
  },
  staff: {
    sales: {
      type: String,
      trim: true
    },
    ops: {
      type: String,
      trim: true
    }
  },
  hotels: {
    type: [hotelSchema],
    validate: {
      validator: function (arr) {
        return arr.length > 0;
      },
      message: 'At least one hotel is required'
    }
  },
  services: {
    type: [serviceSchema],
    default: []
  },
  itinerary: {
    type: String,
    trim: true
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total cannot be negative']
  },
  photos: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'cancelled'],
    default: 'draft',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
quotationSchema.index({ createdAt: -1 });
quotationSchema.index({ 'dates.start': 1, 'dates.end': 1 });
quotationSchema.index({ refId: 1, createdAt: -1 });

// Virtual for total passengers
quotationSchema.virtual('totalPax').get(function () {
  return this.pax.adults + this.pax.children;
});

// Pre-save middleware to auto-calculate checkout dates
quotationSchema.pre('save', function (next) {
  if (this.hotels && this.hotels.length > 0) {
    this.hotels.forEach(hotel => {
      if (hotel.checkIn && hotel.nights) {
        const checkOut = new Date(hotel.checkIn);
        checkOut.setDate(checkOut.getDate() + hotel.nights);
        hotel.checkOut = checkOut;
      }
    });
  }
  next();
});

// Static method to generate reference ID
quotationSchema.statics.generateRefId = async function (destination) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];

  // Get today's count for this destination (use separate Date objects to avoid mutation)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const count = await this.countDocuments({
    destination: destination,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const serial = count + 1;
  const destCode = destination.substring(0, 2).toUpperCase();

  return `QE-${destCode}-${day}${month}-${serial}`;
};

// Instance method to calculate total
quotationSchema.methods.calculateTotal = function () {
  let total = 0;

  // Sum hotel costs
  if (this.hotels && this.hotels.length > 0) {
    total += this.hotels.reduce((sum, hotel) => sum + (hotel.cost || 0), 0);
  }

  // Sum service totals
  if (this.services && this.services.length > 0) {
    total += this.services.reduce((sum, service) => sum + (service.total || 0), 0);
  }

  this.total = total;
  return total;
};

const Quotation = mongoose.model('Quotation', quotationSchema);

module.exports = Quotation;
