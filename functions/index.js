const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')('sk_test_51RPjdVQx6hEw1903Ygj1Eo6sxpug7iwZc1w6uVAxFjmpq2cEzhwv7086tGUJnGCG38FQFj7Zk9N7jWHfkeL7Nq8200zpr0sK4o');
admin.initializeApp();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

exports.stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      endpointSecret 
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    admin.firestore().collection('stripePayments').add({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
      customer: paymentIntent.customer || null,
      metadata: paymentIntent.metadata || {},
    });
  }

  res.json({ received: true });
});