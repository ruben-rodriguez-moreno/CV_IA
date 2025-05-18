const paymentLinks = {
  pro: 'https://buy.stripe.com/test_9B6cN7bcNe2r6Kr8uh6kg00',
  enterprise: 'https://buy.stripe.com/test_5kQ8wR1Cd0bBd8PcKx6kg01' // este link lo configuras en Stripe a 296€/año
};

/**
 * Devuelve la URL de checkout para el plan dado.
 * @param {string} planId  "pro" | "enterprise"
 * @returns {string}       URL de Stripe o lanza error si no existe
 */
export function getPaymentLink(planId) {
  const url = paymentLinks[planId];
  if (!url) throw new Error(`No existe payment link para el plan "${planId}"`);
  return url;
}
