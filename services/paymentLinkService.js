// services/paymentLinkService.js

// Tus Payment Links ya creados en Stripe Dashboard
export const paymentLinks = {
  pro:        'https://buy.stripe.com/test_9B6cN7bcNe2r6Kr8uh6kg00',
  enterprise: 'https://buy.stripe.com/test_5kQ8wR1Cd0bBd8PcKx6kg01'
};

// Tu Billing Portal link estático
export const billingLink = 'https://billing.stripe.com/p/login/test_9B6cN7bcNe2r6Kr8uh6kg00';

/** Devuelve la URL de checkout para el plan dado. */
export function getPaymentLink(planId) {
  const url = paymentLinks[planId];
  if (!url) throw new Error(`No existe payment link para el plan "${planId}"`);
  return url;
}

/** Devuelve tu Billing Portal link estático. */
export function getBillingLink() {
  return billingLink;
}
