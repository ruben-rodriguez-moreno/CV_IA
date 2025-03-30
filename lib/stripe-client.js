import { loadStripe } from '@stripe/stripe-js';

// Load Stripe outside of a component's render to avoid recreating Stripe object on every render
let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};