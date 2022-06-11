const express = require('express');
const bookingController = require('../controller/bookingController.js');
const authController = require('../controller/authController');

//const reviewController = require('../controller/reviewController');
//const reviewRouter = require('./reviewRouter');

const router = express.Router();
router.use(authController.authenticateChk);

router.get('/checkout/:tourId', bookingController.checkoutSession);

router
  .route('/allBookings')
  .get(
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.getAllBooking
  );

router
  .route('/')
  .get(bookingController.checkUserId, bookingController.getAllBooking)
  .delete(authController.restrictTo('admin'), bookingController.deleteBooking);
// .get(
//   authController.restrictTo('admin', 'lead-guide', 'guide'),
//   //will add later after creating virtual populate
//   // bookingController.checkTourId,
//   // bookingController.checkUserId,
//   bookingController.getAllBooking
// );

// too bored will add later 🤥 .post(bookingController.deleteBooking);

router
  .route('/:id')
  .get(
    //authController.restrictTo('admin', 'lead-guide', 'guide'),
    bookingController.getBooking
  )
  .patch(authController.restrictTo('admin'), bookingController.updateBooking);

module.exports = router;
