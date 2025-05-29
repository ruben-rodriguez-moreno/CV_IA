// controller/subscriptionController.js
import { getPaymentLink, getBillingLink } from '../services/paymentLinkService.js';
import { db } from '../config/firebase-admin.js';  // tu instancia Admin de Firestore

/** Shopping: devuelve tu link de Checkout estático según plan. */
export function getCheckoutUrl(planId) {
  return getPaymentLink(planId);
}

/** Status: (dummy) devuelve el plan actual — tú puedes mejorar leyendo la BD. */
export async function getUserPlan(userId) {
  // Aquí leerías Firestore para saber si es free, pro o enterprise
  return 'free';
}

/** Manage: devuelve tu Billing Portal link estático. */
export function getManageUrl() {
  return getBillingLink();
}