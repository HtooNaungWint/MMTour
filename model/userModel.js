const crypto = require('crypto');
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const appAsync = require('../util/catchAsync');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    require: [true, 'tour must have a name'],
    // unique: true,
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
  email: {
    type: String,
    trim: true,
    require: [true, 'user must have a email address'],
    unique: true,
    validate: [validator.isEmail, 'email must be a valid email addresse'],
  },
  passwordUpdatedDate: {
    type: Date,
    //require: [true, 'user must have a date address'],
  },
  picture: {
    type: String,
  },
  password: {
    type: String,
    require: [true, 'user must have a passwords'],
    trim: true,
    minLength: [8, 'passwords cannot be no less than 8 characters'], //validate: [validator.isPasswords, 'passwords must be stronger'],
    select: false,
  },
  role: {
    type: String,
    default: 'user',
    enum: {
      values: ['admin', 'user', 'guide'],
      message: 'Only admin and user accounts can be created',
    },
  },
  passwordConfirmation: {
    type: String,
    validate: {
      //this validation only work on save and create
      validator: function (val) {
        return val === this.password;
      },
      message: `password and passwordConfirmation must both be the same`,
    },
  },
  passwordResetToken: String,
  passwordResetExpDate: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre(/^find/, function (next) {
  //query middleware to block active false user
  //this.find({ acitve: true });
  this.find({ active: { $ne: false } }).select('-__v');
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  //if (!this._update.password) return next();
  this.password = await bcrypt.hash(this.password, 6);
  this.passwordConfirmation = undefined;
});

//instead method
userSchema.methods.correctPassword = async function (candidate, real) {
  //this.password is not valiable because select is set false
  console.log('this process is running');
  return await bcrypt.compare(candidate, real);
};

function toTimestamp(strDate) {
  const datum = Date.parse(strDate);
  return datum / 1000;
}

userSchema.methods.changePassword = async function (jwtTimestamp) {
  if (this.passwordUpdatedDate) {
    const timestamps = this.passwordUpdatedDate.getTime() / 1000;
    console.log(Math.floor(timestamps), jwtTimestamp);
    console.log(Math.floor(timestamps) < jwtTimestamp + 1);
    if (Math.floor(timestamps) > jwtTimestamp + 1) {
      console.log('password updated helppppppp');
      return true;
    }
  }
  return false;
};

userSchema.methods.passwordForget = async function () {
  const randomToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(randomToken)
    .digest('hex');

  //expire time for 15 seconds
  this.passwordResetExpDate = Date.now() + 15 * 60 * 1000;
  return randomToken;
};

userSchema.methods.passwordUpdate = async function (passNew, passCon, user) {
  user.passwordUpdatedDate = Date.now();
  user.password = passNew;
  user.passwordConfirmation = passCon;
  user.passwordResetExpDate = undefined;
  user.passwordResetToken = undefined;
  try {
    await user.save();
    return true;
  } catch (err) {
    return false;
  }
};

const User = mongoose.model('users', userSchema);

module.exports = User;
