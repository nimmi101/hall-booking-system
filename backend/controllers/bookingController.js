const Booking = require('../models/Booking');
const SeminarHall = require('../models/SeminarHall');
const sendEmail = require('../utils/sendEmail');

const sendEmailInBackground = (options, errorMessage = 'Email could not be sent') => {
  sendEmail(options).catch((emailError) => {
    console.error(errorMessage, emailError);
  });
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { hall, date, startTime, endTime, purpose } = req.body;

    // Validate times
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    // Check if hall exists and is active
    const seminarHall = await SeminarHall.findById(hall);
    if (!seminarHall) {
      return res.status(404).json({ message: 'Seminar Hall not found' });
    }
    if (seminarHall.status !== 'active') {
      return res.status(400).json({ message: 'Seminar Hall is currently under maintenance' });
    }

    // Check for overlapping bookings
    // Logic: Existing booking overlaps if it starts before the new booking ends
    // AND it ends after the new booking starts.
    const overlappingBookings = await Booking.find({
      hall,
      date,
      status: { $in: ['confirmed', 'pending'] },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ message: 'Hall is already booked for this time slot' });
    }

    const booking = new Booking({
      user: req.user._id,
      hall,
      date,
      startTime,
      endTime,
      purpose,
    });

    const createdBooking = await booking.save();

    sendEmailInBackground({
      email: req.user.email,
      subject: 'Seminar Hall Booking Request Received',
      message: `
        <h1>Booking Request Received</h1>
        <p>Dear ${req.user.name},</p>
        <p>Your booking request for <strong>${seminarHall.name}</strong> on <strong>${new Date(date).toDateString()}</strong> from <strong>${startTime} to ${endTime}</strong> has been received and is currently <strong>pending approval</strong> from the admin.</p>
        <p>Purpose: ${purpose}</p>
        <br>
        <p>You will receive another email once your booking is confirmed or rejected.</p>
        <p>Thank you,</p>
        <p>Schedulix Team</p>
      `,
    }, 'Booking request email could not be sent');

    res.status(201).json({ booking: createdBooking, emailQueued: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('hall', 'name location')
      .sort({ updatedAt: -1, createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user', 'name email')
      .populate('hall', 'name location')
      .sort({ updatedAt: -1, createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('hall', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the owner or an admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to cancel this booking' });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    booking.status = 'cancelled';
    await booking.save();
    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('hall', 'name location');

    sendEmailInBackground({
      email: booking.user.email,
      subject: 'Seminar Hall Booking Cancelled',
      message: `
        <h1>Booking Cancelled</h1>
        <p>Dear ${booking.user.name},</p>
        <p>Your booking for <strong>${booking.hall.name}</strong> on <strong>${new Date(booking.date).toDateString()}</strong> from <strong>${booking.startTime} to ${booking.endTime}</strong> has been <strong>cancelled</strong>.</p>
        <br>
        <p>Thank you,</p>
        <p>Schedulix Team</p>
      `,
    }, 'Cancellation email could not be sent');

    res.json({ booking: updatedBooking, emailQueued: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Approve/Reject)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be confirmed or rejected' });
    }

    const booking = await Booking.findById(req.params.id).populate('user', 'name email').populate('hall', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Only pending bookings can be updated. This booking is already ${booking.status}` });
    }

    if (status === 'confirmed') {
      const overlappingBooking = await Booking.findOne({
        _id: { $ne: booking._id },
        hall: booking.hall._id,
        date: booking.date,
        status: 'confirmed',
        $and: [
          { startTime: { $lt: booking.endTime } },
          { endTime: { $gt: booking.startTime } }
        ]
      });

      if (overlappingBooking) {
        return res.status(400).json({ message: 'Hall is already confirmed for this time slot' });
      }
    }

    booking.status = status;
    await booking.save();
    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('hall', 'name location');

    sendEmailInBackground({
      email: booking.user.email,
      subject: `Seminar Hall Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `
        <h1>Booking ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
        <p>Dear ${booking.user.name},</p>
        <p>Your booking request for <strong>${booking.hall.name}</strong> on <strong>${new Date(booking.date).toDateString()}</strong> from <strong>${booking.startTime} to ${booking.endTime}</strong> has been <strong>${status}</strong> by the admin.</p>
        <br>
        <p>Thank you,</p>
        <p>Schedulix Team</p>
      `,
    }, 'Status update email could not be sent');

    res.json({ booking: updatedBooking, emailQueued: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  updateBookingStatus,
};
 
