/* eslint-disable prettier/prettier */
//const fs = require('fs');
const Tour = require('../model/tourModel');
const catchAsyn = require('../util/catchAsync');
const AppError = require('../util/appError');
const handler = require('./handler');
const multer = require('multer');
const sharp = require('sharp');
const { pathToFileURL } = require('url');

const multerStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('only image files is allowed to be uploaded', 415), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: imageFilter,
});

exports.resizeTourPic = async (req, res, next) => {
  //not file >> files since there are multiple files
  if (!req.files) return next();

  // cover image
  if (req.files.imageCover[0]) {
    req.body.imageCover = `tour-${req.params.id}-cover-.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({
        quality: 90,
      })
      .toFile(`static/img/tours/${req.body.imageCover}`);
  }

  //images
  //don't forget buffer since we are working on the memoryStorage
  req.body.images = [];
  // wait the async promise to finished for
  await Promise.all(
    req.files.images.map(async (file, index) => {
      req.body.images.push(`tour-${req.params.id}-${index}-.jpeg`);
      console.log(`tour-${req.params.id}-${index}-.jpeg`);

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({
          quality: 90,
        })
        .toFile(`static/img/tours/${req.body.images[index]}`);
    })
  );
  // excuted next only after the promise
  next();
};

exports.uploadTourPic = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// upload.array('images',4)

//get all tour data
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}
exports.deleteTour = handler.deleteOne(Tour, 'tour');

exports.getAllTours = handler.getAllDocuments(Tour, 'tours');

exports.addNewTour = handler.createDocument(Tour, 'tour');

// get tour data by id
exports.getTour = handler.getDocumentById(Tour, 'tour', 'reviews');

// post update new tour
exports.updateTour = handler.updateDocument(Tour, 'tour');

exports.getTourStatus = catchAsyn(async (req, res) => {
  const status = await Tour.aggregate([
    //first match
    {
      $match: {
        //ratingAverage: { $gte: 4.3 }
      },
    },
    {
      $group: {
        _id: '$difficulty',
        totalTours: { $sum: 1 },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgRating: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      tour: status,
    },
  });
});

exports.getMonthlyPlan = catchAsyn(async (req, res) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        totalTours: { $sum: 1 },
        tourNmae: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { totalTours: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      totalTours: plan.length,
      tour: plan,
    },
  });
});

// /tour-within/:distance/center/:location/unit/:unit
// NOTE ***** on google mao latitude, longitude is the format
// location value example = 33.157795, -116.262423
exports.getNearestTour = catchAsyn(async (req, res, next) => {
  const { distance, location, unit } = req.params;
  const [latitude, longitude] = location.split(',');
  if (!latitude || !longitude) {
    next(new AppError('please specify a latitude and longitude', 400));
  }

  // https://www.mongodb.com/docs/manual/reference/operator/query/centerSphere/#mongodb-query-op.-centerSphere
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    // NOTE ***** for $centerSphere longitude, latitude
    startLocation: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  });

  // if (!tours)
  //   next(new appError('no tour is found near the given location 😢', 404));
  res.status(200).json({
    status: 'success',
    length: tours.length,
    message: 'here are the list of available tours',
    data: tours,
  });
});

exports.getDistance = catchAsyn(async (req, res, next) => {
  const { location, unit } = req.params;
  const [latitude, longitude] = location.split(',');
  if (!latitude || !longitude) {
    next(new AppError('please specify a latitude and longitude', 400));
  }

  const multiplier = unit === 'mil' ? 0.00062137119224 : 0.001;

  // https://www.mongodb.com/docs/v5.0/reference/operator/aggregation/geoNear/?_ga=2.240339459.1481700285.1654602008-1265957711.1652270503&_gac=1.186843610.1654606382.CjwKCAjw7vuUBhBUEiwAEdu2pBuMbMZKCDVKLIMXe5xaC8XF-cRswfff4eNYqUk9gamlKc0FMLh6DBoCPfQQAvD_BwE
  const distances = await Tour.aggregate([
    {
      // geoNear will calculate distance from 2dsphere index key 'startLocation'
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude * 1, latitude * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },

    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  // next(new AppError('under maintenance 😢', 404));
  res.status(200).json({
    status: 'success',
    length: distances.length,
    message: 'here are the distances of available tours',
    data: distances,
  });
});
