import '@babel/polyfill';
import { login } from './login';
import { logout } from './logout';
import { mapDisplay } from './mapbox';
import { alertElementShow } from './alert';
import { userUpdate, passwordUpdate } from './user.js';
import { passwordReset } from './passwordReset';
import { signup } from './signup';
import { bookTour } from './stripe';

const mapBox = document.getElementById('map');
const loginData = document.querySelector('.form__login');
const logoutButton = document.querySelector('.nav__el--logout');
const user = document.querySelector('.form-user-data');
const passwordEle = document.querySelector('.form-user-settings');
const passwordResetEle = document.querySelector('.form__passwordReset');
const bookingEle = document.getElementById('book-tour');
const signupEle = document.querySelector('.form__signup');

if (signupEle) {
  signupEle.addEventListener('submit', async (ele) => {
    ele.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirmation = document.getElementById(
      'passwordConfirmation'
    ).value;
    signup(name, email, password, passwordConfirmation);
  });
}

if (user) {
  user.addEventListener('submit', async (ele) => {
    ele.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const picture = document.getElementById('img').files[0];
    userUpdate(name, email, picture);
  });
}

if (passwordResetEle) {
  passwordResetEle.addEventListener('submit', async (ele) => {
    ele.preventDefault();
    const password = document.getElementById('password').value;
    const passwordConfirmation = document.getElementById(
      'passwordConfirmation'
    ).value;
    const token = document.getElementById('token').value;
    passwordReset(password, passwordConfirmation, token);
  });
}

if (passwordEle) {
  passwordEle.addEventListener('submit', async (ele) => {
    ele.preventDefault();
    const password = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm =
      document.getElementById('password-confirm').value;
    //const picture = document.getElementById('password').value;
    passwordUpdate(password, newPassword, newPasswordConfirm);
  });
}

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  mapDisplay(locations);
}

if (bookingEle) {
  bookingEle.addEventListener('click', (ele) => {
    const tourId = ele.target.dataset.tourid;
    alertElementShow('info', 'Payment Page is Loading Please Wait...');
    bookTour(tourId);
  });
}

if (loginData) {
  document.querySelector('.form').addEventListener('submit', async (ele) => {
    ele.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
if (logoutButton) {
  logoutButton.addEventListener('click', async (e) => {
    logout();
  });
}
