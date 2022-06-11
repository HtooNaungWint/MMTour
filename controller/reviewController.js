const Review = require('../model/reviewModel');
const catchAsync = require('../util/catchAsync');
const AppError = require('../util/appError');
const handler = require('./handler');

exports.getTourId = catchAsync(async (req, res, next) => {
  if (req.params.tourId) req.body.tour = req.params.tourId;
  console.log(`req.body.tour ${req.body.tour} = ${req.params.tourId}`);
  next();
});

exports.getAllReview = handler.getAllDocuments(Review, 'review', '', '');

exports.deleteReview = handler.deleteOne(Review, 'review');

exports.addNewReview = catchAsync(async (req, res, next) => {
  req.body.user = req.user.id;
  const review = await Review.findOne({
    user: req.body.user,
    tour: req.body.tour,
  });

  if (!review) {
    const newReview = await Review.create(req.body);
    res.status(201).json({
      status: 'success',
      message: 'new review added successfully.',
      data: {
        review: newReview,
      },
    });
  } else {
    review.rating = req.body.rating;
    review.review = req.body.review;
    await review.save();
    res.status(201).json({
      status: 'success',
      message: 'existing review is updated successfully.',
      data: {
        review: review,
      },
    });
  }
});

exports.getReviewById = handler.getDocumentById(Review, 'review');

exports.getReviewByTour = catchAsync(async (req, res, next) => {
  const review = await Review.find({ tour: req.params.id }).select('-tour');
  if (!review) next(new AppError('No such review exists for the tour', 404));
  res.status(201).json({
    status: 'success',
    length: review.length,
    data: {
      review: review,
    },
  });
});

exports.tourCreateReview = catchAsync(async (req, res, next) => {
  console.log('tourID form body', req.body.tourId);
  const tourId = req.params.tourId || req.body.tourId;
  console.log(`tourId: ${tourId}`);
  req.body.user = req.user.id;
  const review = await Review.findOne({ user: req.body.user, tour: tourId });

  if (!review) {
    req.body.user = req.user.id;
    req.body.tour = tourId;
    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: 'success',
      message: 'new review added successfully.',
      data: {
        review: newReview,
      },
    });
  } else {
    review.rating = req.body.rating;
    review.review = req.body.review;
    await review.save();
    res.status(201).json({
      status: 'success',
      message: 'existing review is updated successfully.',
      data: {
        review: review,
      },
    });
  }
});
