import Stripe from 'stripe';

// Initialize Stripe with the secret key for server-side operations
export function getServerStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', // Use the latest API version
  });
}