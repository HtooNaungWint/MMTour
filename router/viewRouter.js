const express = require('express');
const { models } = require('mongoose');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const Tour = require('../model/tourModel');
const User = require('../model/userModel');
const Booking = require('../model/bookingModel');
const handler = require('../controller/handler');
const bookingController = require('../controller/bookingController');
const authController = require('../controller/authController');

const router = express.Router();

const loginChk = async (req, res, next) => {
  token = req.cookies.jwt;
  try {
    if (!token) {
      return next();
    }
    const decodedData = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET_KEY
    );

    const user = await User.findById(decodedData.id);

    if (!user) {
      return next();
    }

    if (await user.changePassword(decodedData.iat)) {
      return next();
    }

    //user is login
    res.locals.user = user;
    next();
  } catch (e) {
    next();
  }
};

router
  .route('/overview')
  .get(loginChk, bookingController.createBooking, async (req, res, next) => {
    try {
      const tours = await Tour.find();
      res.status(200).render('overview', {
        title: 'All Tours',
        tours: tours,
      });
    } catch (err) {
      res.status(200).render('overview', {
        title: 'All Tours | fail',
        tours: [],
      });
    }
  });

router
  .route('/')
  .get(loginChk, bookingController.createBooking, async (req, res, next) => {
    try {
      const tours = await Tour.find();
      res.status(200).render('overview', {
        title: 'All Tours',
        tours: tours,
      });
    } catch (err) {
      res.status(200).render('overview', {
        title: 'All Tours | fail',
        tours: [],
      });
    }
  });
router.route('/tour/:name').get(loginChk, async (req, res, next) => {
  try {
    const tour = await Tour.findOne({ name: req.params.name }).populate(
      'reviews'
    );

    if (!tour) {
      res.status(404).render('tourNotFound', {
        title: 'Tour Name 404',
        message: 'The tour is not available',
      });
    }

    res.status(200).render('tour', {
      title: tour.name,
      tour: tour,
    });
  } catch (err) {
    res.status(404).render('tour', {
      title: req.params.name + ' | fail',
      status: 404,
      tour: [],
    });
  }
});

router.route('/login').get(loginChk, (req, res) => {
  res.status(200).render('login', {
    title: 'Login',
  });
});

router.route('/signup').get(loginChk, (req, res) => {
  res.status(200).render('Signup', {
    title: 'signup',
  });
});

router.route('/user').get(loginChk, (req, res) => {
  if (!res.locals.user) {
    res.status(401).render('errorPage', {
      title: 'You are not logged in',
      message: 'You are not logged in',
      status: 401,
    });
  }
  res.status(200).render('userPage', {
    title: 'User Settings',
  });
});

router.route('/passwordReset/:token').get(loginChk, (req, res) => {
  if (!req.params.token) {
    res.status(401).render('errorPage', {
      title: 'Password Reset',
      message: 'You need token to reset your password',
      status: 401,
    });
  }
  res.status(200).render('passwordReset', {
    title: 'Password Reset',
    token: req.params.token,
  });
});

router.route('/bookings').get(loginChk, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: res.locals.user._id }).populate(
      'tour'
    );

    // you can virtual populate booking with tour
    // but instead we will just find tour with each booking id
    //const tourIds = bookings.map((booking) => booking.tour);
    //const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render('booking', {
      title: 'Bookings',

      bookings: bookings,
    });
  } catch (err) {
    res.status(401).render('errorPage', {
      title: 'Password Reset',
      message: 'something went wrong please content the administrator',
      status: 401,
    });
  }
});

// router.route('/logout').get((req, res) => {
//   // create cookie
//   const cookieOption = {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRE_DATE * 1000 * 60 * 60 * 24
//     ),
//     httpOnly: true,
//   };

//   //create cookie with empty jwt token
//   res.cookie('jwt ', ' ', cookieOption);

//   res.status(200).render('login', {
//     title: 'Login',
//   });
// });

module.exports = router;
