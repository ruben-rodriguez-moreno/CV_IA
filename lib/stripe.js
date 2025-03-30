import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Load Stripe on the client side
export const getStripe = () => {
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return loadStripe(stripePublishableKey);
};

// Initialize Stripe on the server side
let stripe;

export const getServerStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', // Use the latest API version
    });
  }
  return stripe;
};

// Subscription plan constants
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

// Client-side initialization (if needed)
export const createCheckoutSession = async (priceId, userId) => {
  try {
    const response = await fetch('/api/subscription/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId, userId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Define subscription plan limits
export const PLAN_LIMITS = {
  [SUBSCRIPTION_PLANS.FREE]: {
    cvLimit: 5,
    features: ['Basic CV analysis', 'Standard support'],
  },
  [SUBSCRIPTION_PLANS.PRO]: {
    cvLimit: 100,
    features: ['Advanced CV analysis', 'Export data', 'Enhanced support'],
  },
  [SUBSCRIPTION_PLANS.ENTERPRISE]: {
    cvLimit: 1000,
    features: ['Premium CV analysis', 'Advanced exports', 'Priority support', 'Dedicated account manager'],
  },
};
