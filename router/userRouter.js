const express = require('express');
const authController = require('../controller/authController');
const bookingRouter = require('./bookingRouter');

const router = express.Router();

router
  .get(
    '/getAllUSers',
    authController.authenticateChk,
    authController.restrictTo('admin'),
    authController.getAllUSers
  )

  .get('/logout', authController.logout)

  .post(
    '/signup',
    authController.uploadUserPic,
    authController.resizeUserPic,
    authController.signup
  )

  .post('/login', authController.login)
  .post('/passwordReset', authController.forgetPassword)
  .patch('/passwordReset/:token', authController.resetPassword)
  .patch(
    '/passwordupdate',
    authController.authenticateChk,
    authController.updatePassword
  )
  .patch(
    '/userUpdate',
    authController.authenticateChk,
    authController.uploadUserPic,
    authController.resizeUserPic,
    authController.userUpdate
  )
  .delete(
    '/Delete',
    authController.authenticateChk,
    //authController.restrictTo('admin', 'lead-guide', 'guide'),
    authController.userDelete
  );

router
  .route('/:id')
  .patch(
    authController.authenticateChk,
    authController.restrictTo('admin'),
    authController.changeUser,
    authController.uploadUserPic,
    authController.resizeUserPic,
    authController.userForceUpdate
  );

router.use('/bookings', bookingRouter);

module.exports = router;
