// controller/subscriptionController.js
import { getPaymentLink } from '../services/paymentLinkService.js'

/**
 * Obtiene la URL de checkout para un plan dado.
 * @param {string} planId
 * @returns {string} URL de Stripe
 */
export function getCheckoutUrl(planId) {
  return getPaymentLink(planId)
}

/**
 * Devuelve el plan actual de un usuario (leer de tu BBDD real aquí).
 * @param {string} userId
 * @returns {Promise<string>} 'free' | 'pro' | 'enterprise'
 */
export async function getUserPlan(userId) {
  // TODO: sustituye por tu lectura de BD
  return 'free'
}
