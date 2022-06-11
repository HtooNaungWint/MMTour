const express = require('express');
const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    authController.authenticateChk,
    authController.restrictTo('admin'),
    reviewController.getTourId,
    reviewController.getAllReview
  )
  //.post(authController.authenticateChk, reviewController.addNewReview);
  .post(authController.authenticateChk, reviewController.tourCreateReview);

router
  .get('/:id', reviewController.getReviewById)
  .get(
    '/reviewByTour/:id',
    authController.authenticateChk,
    reviewController.getReviewByTour
  )
  .delete(
    '/delete/:id',
    authController.authenticateChk,
    authController.restrictTo('admin'),
    reviewController.deleteReview
  );

module.exports = router;
