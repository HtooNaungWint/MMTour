const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      require: [true, 'tour must have a name'],
      unique: true,
      maxLength: [50, 'tour name cannot be no more than 50 characters'],
      minLength: [3, 'tour name cannot be no less than 3 characters'],
      validate: {
        validator: function (val) {
          return validator.isAlphanumeric(validator.blacklist(val, ' '));
        },
        // this code does not work //message: `Discount price {$this.priceDiscount} must be less than actual price {$this.price} `,
        //note update wont work
        message: 'name must be characters strings',
      },
    },
    slug: String,
    duration: {
      type: Number,
      require: [true, 'tour must have a duration'],
    },
    difficulty: {
      type: String,
      default: 'medium',
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'difficulty should be easy, medium or hard',
      },
    },
    GroupSize: {
      type: Number,
      require: [true, 'tour must have a group size'],
    },
    price: {
      type: Number,
      require: [true, 'tour must have a price'],
    },
    ratingAverage: {
      type: Number,
      default: '3',
      min: [0, 'rating must be greater than 0'],
      max: [5, 'rating must be lass than 5'],
      set: (val) => Math.max(val * 10) / 10,
    },
    ratingQuantity: {
      type: Number,
      default: '0',
    },
    priceDiscount: {
      type: Number,
      default: '0',
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        // this code does not work //message: `Discount price {$this.priceDiscount} must be less than actual price {$this.price} `,
        //note update wont work
        message: `Discount price ({VALUE}) must be less than actual price`,
      },
    },
    summary: {
      type: String,
      trim: true,
      require: [true, 'tour must have a summary'],
      minLength: [10, 'summary must be at least 10 characters long'],
      // maxLength: [250, 'summary must be at most 250 characters long'],
    },
    description: {
      type: String,
      trim: true,
      minLength: [10, 'description must be at least 10 characters long'],
      // maxLength: [600, 'description must be at most 600 characters long'],
    },
    imageCover: {
      type: String,
      require: [true, 'tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GEO json format\
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // GEO json format\
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'users',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, rating: -1 });
//startLocation is geo location
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationByWeeks').get(function () {
  return this.duration / 7;
});

//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'reviews',
  foreignField: 'tour',
  localField: '_id',
  perDocumentLimit: 5, // only 5 review will show
});

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//doesn't use function because doesn't require 'this'.
// tourSchema.post('save', (doc, next) => {
//   console.log(`document : ${doc}`);
//   next();
// });

//all queries that contain find
tourSchema.pre(/^find/, function (next) {
  const populateField = {
    path: 'guides',
    select: '-passwordUpdatedDate', //already disabled at middleware
  };
  this.find({ secretTour: { $ne: true } }).populate(populateField);
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  this.end = Date.now();
  console.log(`Query run time: ${this.end - this.start} milliseconds`);
  next();
});

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   next();
// });

// tourSchema.pre('save', async function (next) {
//   const tourGuide = this.guides.map(async (ele) => await User.findById(ele));
//   this.guides = await Promise.all(tourGuide);
//   next();
// });

//Document middleware : run before .save() .create
//it will not execute on .insert()
const Tour = mongoose.model('tours', tourSchema);

module.exports = Tour;

// const testTour = new Tour({
//   name: 'Super Dangerous Space Trip',
//   rating: '2.1',
//   price: 80000,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log('save success');
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('save error');
//     console.log(err);
//   });
