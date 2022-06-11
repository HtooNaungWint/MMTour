const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const Tour = require('./tourModel');
const AppError = require('../util/appError');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      maxLength: [1024, 'tour name cannot be no more than 50 characters'],
    },
    rating: {
      type: Number,
      default: '0',
      min: [1, 'rating must be greater than 0'],
      max: [5, 'rating must be lass than 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'tours',
      require: [true, 'reviewer must select a tour to review'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'users',
      require: [true, 'reviewer must be signed in to review to any given tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  const populateField = {
    //path: 'user tour', // don't show tour data since review no need to show tour data
    path: 'user',
    select: '-__V',
  };
  this.find().populate(populateField);
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //this. is review schema
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  }
  //set to default when there are no more reviews
  else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// need to use post because review need to calculate after insert
reviewSchema.post('save', function () {
  // this points to current review
  // this.constructor = Review in line 83
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
// only pre hook will work because post because it will no longer be able to access to query
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  if (!this.r) next(new AppError('the review was not found', 404));
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  //but findOne data are stored in r
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('reviews', reviewSchema);

module.exports = Review;
