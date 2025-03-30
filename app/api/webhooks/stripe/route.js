import { getServerStripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { db } from '/lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

// This handler doesn't need auth as it's called by Stripe
export async function POST(req) {
  try {
    const stripe = getServerStripe();
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        await handleInvoicePaid(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session) {
  // Extract user ID from metadata
  const userId = session.metadata.userId;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  // Update user in database with Stripe details
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionStatus: 'active',
    updatedAt: new Date().toISOString(),
  });
  
  // Also store subscription details in a separate collection
  const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
  await setDoc(subscriptionRef, {
    userId,
    customerId,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

async function handleInvoicePaid(invoice) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;

  // Find user by customerId
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) {
    console.log('No user found with that customer ID.');
    return;
  }

  const userId = snapshot.docs[0].id;

  // Update subscription status
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    subscriptionStatus: 'active',
    updatedAt: new Date().toISOString(),
  });

  // Update subscription in the subscriptions collection
  const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
  await updateDoc(subscriptionRef, {
    status: 'active',
    updatedAt: new Date().toISOString(),
    currentPeriodEnd: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
  });
}

async function handleInvoicePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;

  // Find user by customerId
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) {
    console.log('No user found with that customer ID.');
    return;
  }

  const userId = snapshot.docs[0].id;

  // Update subscription status
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    subscriptionStatus: 'past_due',
    updatedAt: new Date().toISOString(),
  });

  // Update subscription in the subscriptions collection
  const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
  await updateDoc(subscriptionRef, {
    status: 'past_due',
    updatedAt: new Date().toISOString(),
  });
}

async function handleSubscriptionDeleted(subscription) {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer;

  // Find user by customerId
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) {
    console.log('No user found with that customer ID.');
    return;
  }

  const userId = snapshot.docs[0].id;

  // Update user to free plan
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    subscriptionStatus: 'canceled',
    updatedAt: new Date().toISOString(),
  });

  // Update subscription in the subscriptions collection
  const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
  await updateDoc(subscriptionRef, {
    status: 'canceled',
    updatedAt: new Date().toISOString(),
  });
}

async function handleSubscriptionUpdated(subscription) {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer;

  // Find user by customerId
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) {
    console.log('No user found with that customer ID.');
    return;
  }

  const userId = snapshot.docs[0].id;

  // Update subscription status
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    subscriptionStatus: subscription.status,
    updatedAt: new Date().toISOString(),
  });

  // Update subscription in the subscriptions collection
  const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
  await updateDoc(subscriptionRef, {
    status: subscription.status,
    updatedAt: new Date().toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  });
}
