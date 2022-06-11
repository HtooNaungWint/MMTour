const Booking = require('../model/bookingModel');
const catchAsync = require('../util/catchAsync');
const AppError = require('../util/appError');
const handler = require('./handler');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const Tour = require('../model/tourModel');

exports.checkUserId = (req, res, next) => {
  if (req.user) req.body.user = req.user.id;
  console.log(`req.user is ${req.user}`);
  next();
};

exports.checkoutSession = catchAsync(async (req, res, next) => {
  console.log('hello from booking controller');
  if (!req.params.tourId)
    next(new appError('Which tour are you gonna book 🫤', 404));

  const tour = await Tour.findById(req.params.tourId);

  if (!tour)
    next(new appError('The Tour you are looking for is not available', 404));
  console.log(tour);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    //success workaround before stripe session is created
    success_url: `${req.protocol}://${req.get('host')}/overview?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,

    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.name.replace(
      / /g,
      '%20'
    )}`,
    customer_email: req.user.email,
    client_reference_id: tour.id,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/tour-1-cover.jpg`],
        amount: tour.price * 1800, // no more than 1000,000 MMk
        currency: 'mmk',
        quantity: 1,
      },
    ],
  });
  // creadit card no is 4242, 4242, 4242, 4242
  // any date nay cvc
  // any name

  res.status(200).json({
    status: 'success',
    message: 'Successfuly purchased',
    session,
  });
});

exports.deleteBooking = handler.deleteOne(Booking, 'bookings');

exports.getAllBooking = handler.getAllDocuments(Booking, 'bookings');

exports.addNewBooking = handler.createDocument(Booking, 'bookings');

// get tour data by idbookings
exports.getBooking = handler.getDocumentById(Booking, 'bookings', 'tour');

// post update new tour
exports.updateBooking = handler.updateDocument(Booking, 'bookings');

//TODO: add this is not secure.but will fixed later
exports.createBooking = catchAsync(async (req, res, next) => {
  console.log('createBooking is working');
  console.log(req.query);
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  console.log('booking is successful');
  res.redirect(req.originalUrl.split('?')[0]);
});
