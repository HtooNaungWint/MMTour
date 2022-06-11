const express = require('express');
const tourController = require('../controller/tourcontroller');
const authController = require('../controller/authController');
//const reviewController = require('../controller/reviewController');
const reviewRouter = require('./reviewRouter');
const bookingRouter = require('./bookingRouter');
const bookingController = require('../controller/bookingController');

const router = express.Router();

//ecpress.router.param method will check Id
//router.param('id', tourController.checkId);

router
  .route('/tour-within/:distance/center/:location/unit/:unit')
  .get(tourController.getNearestTour);

router.route('/distance/:location/unit/:unit').get(tourController.getDistance);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.authenticateChk,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourPic,
    tourController.resizeTourPic,
    tourController.addNewTour
  );

router
  .route('/tourstatus')
  .get(
    authController.authenticateChk,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getTourStatus
  );

router
  .route('/mountlyplan/:year')
  .get(
    authController.authenticateChk,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.authenticateChk,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourPic,
    tourController.resizeTourPic,
    tourController.updateTour
  );

router
  .route('/:id/delete')
  .delete(
    authController.authenticateChk,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

router.use('/:tourId/review', reviewRouter);

//TODO: Add
router.use('/:tourId/bookings', bookingRouter);
//.route('/:tourId/review')
//.post(authController.authenticateChk, reviewController.tourCreateReview);

module.exports = router;
