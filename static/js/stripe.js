// This is your test secret API key.
/* eslint-disable */
import axios from 'axios';
import { alertElementShow } from './alert';

const stripe = Stripe(
  'pk_test_51L9FPxCOBO7JoOZFlPhyhQpwklRRFJe3LO9LBvrBoKLmzbdvzn4Gd1Bapu5D4S6e50qEUhMnaeyZHCyTBK3587FH00pS72pcY5'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/booking/checkout/${tourId}`);
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    alertElementShow('error', err);
  }
};
