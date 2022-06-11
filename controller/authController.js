const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const appAsync = require('../util/catchAsync');
const AppError = require('../util/appError');
const Email = require('../util/emailer');
const multer = require('multer');
const sharp = require('sharp');
const { pathToFileURL } = require('url');

//set up multer
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'static/img/users');
//   },
//   //this will only allowed only picture
//   filename: (req, file, cb) => {
//     //file name user-${id}-${timestamp.jpg}
//     const extension = file.mimetype.split('/')[1];
//     //cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//     cb(null, `user-${req.user.id}.${extension}`);
//   },
// });

// stored image in memoryStorage to resize
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

exports.uploadUserPic = upload.single('picture');

exports.resizeUserPic = (req, res, next) => {
  if (!req.file) return next();
  // read image from memoryStorage
  req.file.filename = `user-${req.user.id}.jpeg`;
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({
      // 90% quality
      quality: 90,
    })
    .toFile(`static/img/users/${req.file.filename}`);
  next();
};

const tokenGenerate = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_TIMEOUT,
  });

const tokenSend = (user, statusCode, statusMessage, res) => {
  const token = tokenGenerate(user._id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE_DATE * 1000 * 60 * 60 * 24
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;
  res.cookie('jwt ', token, cookieOption);
  res.status(statusCode).json({
    status: statusMessage,
    token,
    data: user,
  });
};

const filerBody = (obj, ...allowedField) => {
  const returnObj = {};
  Object.keys(obj).forEach((field) => {
    if (allowedField.includes(field)) returnObj[field] = obj[field];
  });
  return returnObj;
};

exports.getAllUSers = appAsync(async (req, res, next) => {
  //const newUser = await User.create(req.body);

  const users = await User.find().select('+active');

  res.status(200).json({
    status: 'success',
    users: users,
  });
});

exports.signup = appAsync(async (req, res, next) => {
  //const newUser = await User.create(req.body);

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    picture: req.body.picture,
    password: req.body.password,
    passwordConfirmation: req.body.passwordConfirmation,
  });
  new Email(newUser, `${process.env.BASE_ROUT}/user`).sendWelcome();
  tokenSend(newUser, 200, 'success', res);
});

exports.login = appAsync(async (req, res, next) => {
  //const email = req.body.email;
  //const password = req.body.password;
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please enter email and password', 404));
  }
  //use '+' sign to select password because select is set false by default
  const user = await User.findOne({ email }).select('+password');

  //const passwordCorrect = userPassword.correctPassword(password, userPassword);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('email or password incorrect', 400));
  }
  user.password = undefined;
  tokenSend(user, 200, 'success', res);
});

exports.logout = appAsync((req, res) => {
  // create cookie
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE_DATE * 1000 * 60 * 60 * 24
    ),
    httpOnly: true,
  };

  //create cookie with empty jwt token
  res.cookie('jwt ', '', cookieOption);
  res.status(200).json({
    status: 'success',
    message: 'User is logout successfully',
  });
});

exports.authenticateChk = appAsync(async (req, res, next) => {
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('please login to view the context', 404));
  }

  const decodedData = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  const user = await User.findById(decodedData.id);

  if (!user) {
    return next(new AppError('User no longer exist', 404));
  }
  if (await user.changePassword(decodedData.iat)) {
    return next(new AppError('password have updated, please login again', 404));
  }

  //grand access to protected route
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgetPassword = appAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(new AppError(`please enter a valid email`, 404));
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(`no user found for ${req.body.email}`, 404));
  }
  const resetToken = await user.passwordForget();
  await user.save({ validateBeforeSave: false });

  //build password reset link for user to reset password
  const resetLink = `${req.protocol}://${req.get('host')}${req.baseUrl
    .split('/')
    .slice(0, -1)
    .join('/')}/users/passwordReset/${resetToken}`;

  const message = `please go to following link to reset password
    - ${resetLink}`;
  try {
    new Email(
      user,
      `${req.protocol}://${req.get('host')}/passwordReset/${resetToken}`
    ).sendPasswordRequest();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpDate = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        `mail send fail please try again later or contect the administrator`,
        500
      )
    );
  }
  let token = '';
  if (process.env.NODE_ENV === 'development') {
    token = resetToken;
  }
  res.status(200).json({
    status: 'success',
    message: `Password reset link was send to your email,
    please check your email form myTour.com`,
    token: token,
  });
});

exports.resetPassword = appAsync(async (req, res, next) => {
  const token = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpDate: { $gt: Date(Date.now()) },
  });
  if (!user) {
    next(
      new AppError(
        `Token have been expired or the user is longer available`,
        500
      )
    );
  }
  if (
    await user.passwordUpdate(
      req.body.password,
      req.body.passwordConfirmation,
      user
    )
  ) {
    user.password = undefined;
    tokenSend(user, 200, 'success', res);
  } else {
    next(new AppError(`Password reset fail please try again later`, 500));
  }
});

exports.updatePassword = appAsync(async (req, res, next) => {
  if (!req.body.newPassword || !req.body.newPasswordConfirm) {
    return next(
      new AppError(`Please enter new password and confirm password`, 404)
    );
  }
  if (req.body.newPassword !== req.body.newPasswordConfirm) {
    return next(
      new AppError(`New password and confirm password do not match`, 404)
    );
  }
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError(`User does not exist`, 404));
  }
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(
      new AppError(`Please enter correct password to change your password`, 404)
    );
  }

  if (req.body.newPassword === req.body.password) {
    return next(new AppError(`New password is already in use`, 404));
  }

  user.password = req.body.newPassword;
  user.passwordUpdatedDate = Date.now();

  await user.save();
  user.password = undefined;
  tokenSend(user, 200, 'success', res);
});

exports.userUpdate = appAsync(async (req, res, next) => {
  if (req.body.newPasswordConfirm || req.body.newPassword) {
    return next(
      new AppError(`You can not update your password directly.`, 404)
    );
  }
  const newBody = filerBody(req.body, 'name', 'email');
  if (req.file) newBody.picture = req.file.filename;
  const updateUser = await User.findByIdAndUpdate(req.user.id, newBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    message: `User successfully updated`,
    data: updateUser,
  });
});

exports.userDelete = appAsync(async (req, res, next) => {
  const updateUser = await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });
  res.status(200).json({
    status: 'success',
    message: `User is successfully deleted please contact the administrator to reactivated your account`,
  });
});
