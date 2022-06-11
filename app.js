const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
app.use(cors());

const tourRouter = require('./router/tourRouter');
const userRouter = require('./router/userRouter');
const reviewRouter = require('./router/reviewRouter');
const viewRouter = require('./router/viewRouter');
const bookingRouter = require('./router/bookingRouter');

const AppError = require('./util/appError');

const errorController = require('./controller/errorController');
//const { use } = require('./router/tourRouter');

//set up view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'view'));

//global security settings
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

//for highlighting console log and development logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

//ip request limiter
const limiter = rateLimit({
  max: 300,
  window: 60 * 60 * 1000,
  message:
    'Too many requests from your ip address please try again after 1 hour',
});
//limiter is effected to all rout related to api
app.use('/api', limiter);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

//express body prasers and body to request.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(req.cookies);
  next();
});

// data sanitizer for noSQL query injection
app.use(mongoSanitize());
// data sanitizer for Cross Site Scripting XSS
app.use(xssClean());
//hpp http parameters pollution // remove all duplicate parameters
app.use(
  hpp({
    whitelist: ['duration', 'rating', 'difficulty', 'GroupSize'],
  })
);

//express serving static files
//app.use(express.static('./static/'));
app.use(express.static(path.join(__dirname, 'static')));

//global routes
app.use('/', viewRouter);
// app.get('/', (req, res) => {
//   //it will look inside view folder described near line 22
//   res.status(200).render('base');
// });

// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours',
//   });
// });

// app.get('/tour', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'Myanmar Main Tour',
//   });
// });

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

//error 404 rout
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: '404 Not Found',
  //   message: '404 Not Found',
  // });
  // const err = new Error(`Koko node can't comunicate 🤥`);
  // err.statusCode = 404;
  // err.status = '404 Not Found';
  //
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

//error handler
app.use(errorController);

//app.route('/api/v1/tours').get(getAllTours).post(addNewTour);
//app.route('/api/v1/tours/:id').get(getTour);

module.exports = app;
