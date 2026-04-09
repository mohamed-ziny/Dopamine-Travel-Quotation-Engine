const Quotation = require('../models/Quotation');
const Destination = require('../models/Destination');
const User = require('../models/User');

const upsertDestinationAndHotels = async (destName, hotels) => {
  if (!destName) return;
  let dest = await Destination.findOne({ name: { $regex: new RegExp(`^${destName}$`, 'i') } });

  if (!dest) {
    dest = new Destination({ name: destName, cities: [], hotels: [] });
  }

  if (hotels && hotels.length > 0) {
    hotels.forEach(h => {
      if (!h.city || !h.hotel) return;

      const cityLower = h.city.toLowerCase();
      if (!dest.cities.some(c => c.toLowerCase() === cityLower)) {
        dest.cities.push(h.city);
      }

      const hotelLower = h.hotel.toLowerCase();
      if (!dest.hotels.some(ho => ho.name.toLowerCase() === hotelLower && ho.city.toLowerCase() === cityLower)) {
        dest.hotels.push({ city: h.city, name: h.hotel, rating: 4 });
      }
    });
  }
  await dest.save();
};

const upsertUser = async (userName) => {
  if (!userName) return;
  let user = await User.findOne({ name: { $regex: new RegExp(`^${userName}$`, 'i') } });
  if (!user) {
    const email = userName.toLowerCase().replace(/[^a-z0-9]/g, '') + '@dopaminetravel.com';
    user = new User({ name: userName, email, password: 'password123', role: 'sales' });
    try { await user.save(); } catch (e) { console.error('User upsert failed:', e.message); }
  }
};

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Public
exports.getAllQuotations = async (req, res) => {
  try {
    const {
      destination,
      status,
      sales,
      ops,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    const filter = {};
    if (destination) filter.destination = destination;
    if (status) filter.status = status;
    if (sales) filter['staff.sales'] = sales;
    if (ops) filter['staff.ops'] = ops;

    // Date range filter
    if (startDate || endDate) {
      filter['dates.start'] = {};
      if (startDate) filter['dates.start'].$gte = new Date(startDate);
      if (endDate) filter['dates.start'].$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const quotations = await Quotation
      .find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await Quotation.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: quotations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: quotations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single quotation by ID
// @route   GET /api/quotations/:id
// @access  Public
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get quotation by reference ID
// @route   GET /api/quotations/ref/:refId
// @access  Public
exports.getQuotationByRefId = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ refId: req.params.refId });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Public
exports.createQuotation = async (req, res) => {
  try {
    const {
      destination,
      dates,
      pax,
      userName,
      hotels,
      services,
      itinerary
    } = req.body;

    await upsertDestinationAndHotels(destination, hotels);
    await upsertUser(userName);

    // Generate reference ID
    const refId = await Quotation.generateRefId(destination);

    // Create quotation object
    const quotation = new Quotation({
      refId,
      destination,
      dates,
      pax,
      userName,
      hotels,
      services,
      itinerary
    });

    // Calculate total
    quotation.calculateTotal();

    // Save to database
    await quotation.save();

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Public
exports.updateQuotation = async (req, res) => {
  try {
    let quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (req.body.destination || req.body.hotels) {
      await upsertDestinationAndHotels(req.body.destination || quotation.destination, req.body.hotels || quotation.hotels);
    }
    if (req.body.userName) {
      await upsertUser(req.body.userName);
    }

    // Update fields
    Object.assign(quotation, req.body);

    // Recalculate total
    quotation.calculateTotal();

    // Save
    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Public
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    await quotation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quotation deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update quotation status
// @route   PATCH /api/quotations/:id/status
// @access  Public
exports.updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['draft', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: draft, confirmed, or cancelled'
      });
    }

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get quotation statistics
// @route   GET /api/quotations/stats/summary
// @access  Public
exports.getQuotationStats = async (req, res) => {
  try {
    const stats = await Quotation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgRevenue: { $avg: '$total' }
        }
      }
    ]);

    const totalQuotations = await Quotation.countDocuments();
    const totalRevenue = await Quotation.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Destination breakdown
    const byDestination = await Quotation.aggregate([
      {
        $group: {
          _id: '$destination',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Staff breakdown
    const bySales = await Quotation.aggregate([
      {
        $group: {
          _id: '$staff.sales',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalQuotations,
        totalRevenue: totalRevenue[0]?.total || 0,
        byStatus: stats,
        byDestination,
        bySales
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Copy (duplicate) a quotation
// @route   POST /api/quotations/:id/copy
// @access  Public
exports.copyQuotation = async (req, res) => {
  try {
    const original = await Quotation.findById(req.params.id);

    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Generate a new reference ID
    const refId = await Quotation.generateRefId(original.destination);

    // Create a copy with new refId and draft status
    const copyData = original.toObject();
    delete copyData._id;
    delete copyData.id;
    delete copyData.createdAt;
    delete copyData.updatedAt;
    delete copyData.__v;

    copyData.refId = refId;
    copyData.status = 'draft';

    const newQuotation = new Quotation(copyData);
    newQuotation.calculateTotal();
    await newQuotation.save();

    res.status(201).json({
      success: true,
      message: `Quotation copied as ${refId}`,
      data: newQuotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Upload photos for a quotation
// @route   POST /api/quotations/:id/photos
// @access  Public
exports.uploadPhotos = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one valid image file'
      });
    }

    // Get array of file paths
    const newPhotos = req.files.map(file => `/uploads/${file.filename}`);

    // Append to existing photos array
    quotation.photos = [...(quotation.photos || []), ...newPhotos];

    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Photos uploaded successfully',
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
