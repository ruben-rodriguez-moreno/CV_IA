// pages/api/webhook.js
import { buffer } from 'micro';
import Stripe from 'stripe';
import { admin } from '../../../../config/firebase-admin';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  // 1) Verificar la firma de Stripe
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Invalid signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // 2) Extraer el email del evento
    let email;
    if (event.type.startsWith('invoice.')) {
      const invoice = event.data.object;
      email = invoice.customer_email;
    } else if (event.type.startsWith('customer.subscription.')) {
      const sub = event.data.object;
      // Si usas Checkout Sessions:
      email = sub.customer_details?.email;
      // Si no, obtén el cliente de Stripe para leer su email:
      if (!email) {
        const cust = await stripe.customers.retrieve(sub.customer);
        email = cust.email;
      }
    }

    if (!email) {
      console.warn('⚠️ No email in Stripe event, skipping.');
      return res.status(200).json({ received: true });
    }

    // 3) Mapear email → Firebase UID
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    // 4) Determinar si la suscripción está activa
    let isActive = false;
    if (
      event.type === 'invoice.payment_succeeded' ||
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const sub = event.data.object;
      isActive = sub.status === 'active';
    } else if (event.type === 'customer.subscription.deleted') {
      isActive = false;
    } else {
      // Otros eventos no nos interesan
      return res.status(200).json({ received: true });
    }

    // 5) Actualizar el Custom Claim en Auth
    await admin.auth().setCustomUserClaims(uid, { subscriptionActive: isActive });
    console.log(`🔔 [Webhook] UID=${uid} subscriptionActive=${isActive}`);

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Error processing Stripe webhook:', err);
    return res.status(500).end();
  }
}
