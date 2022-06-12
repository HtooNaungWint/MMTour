//error handler
const AppError = require('../util/appError');

const handleCatchErrorDb = (error) => {
  const message = `Invalid ${error.path}: ${error.value}.`;
  return new AppError(message, 400);
  //return rtn;
};

const handleDuplicateErrorDb = (error) => {
  const value = error.message.match(/(?:"[^"]*"|^[^"]*$)/)[0];
  const message = `Duplate Field: ${value}. please another value`;
  return new AppError(message, 500);
  //return rtn;
};

const handlerValidatorErrorDb = (error) => {
  //const err = Object.values(error).map((el) => el.message);
  const message = `${error.message}`;
  return new AppError(message, 500);
};

const handlerWebtokenError = (error) => {
  const message = `Web token Invalid, please login again`;
  return new AppError(message, 401);
};

const handlerTokenExpiredError = (error) => {
  const message = `Login expired, Please login again`;
  return new AppError(message, 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else if (process.env.NODE_ENV === 'production') {
    console.log('dfsf.////////////');
    console.error(req.originalUrl);
    if (!req.originalUrl.startsWith('/api')) {
      console.error('hello baby');
      return res.status(200).render('errorPage', {
        title: '404',
      });
    }
    if (err.name === 'CastError') err = handleCatchErrorDb(err);
    if (err.code === 11000) err = handleDuplicateErrorDb(err);
    if (err.name === 'ValidationError') err = handlerValidatorErrorDb(err);
    if (err.name === 'JsonWebTokenError') err = handlerWebtokenError(err);
    if (err.name === 'TokenExpiredError') err = handlerTokenExpiredError(err);
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error(err);
      console.error('Nooooo Error; Someone Helppp! ');
      res.status(500).json({
        status: 'error',
        message: 'something went wrong',
      });
    }
  }
};
