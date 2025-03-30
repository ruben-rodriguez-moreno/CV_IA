import { NextResponse } from 'next/server';
import { getServerStripe } from '../../../../lib/stripe-server';
import { SUBSCRIPTION_PLANS } from '../../../../lib/stripe';
import { admin } from '../../../../config/firebase-admin';

export async function POST(request) {
  try {
    // Get the request body
    const body = await request.json();
    const { priceId, userId } = body;

    // Validate input
    if (!priceId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const email = userData.email;

    // Initialize Stripe
    const stripe = getServerStripe();

    // Get or create a Stripe customer
    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      // Create a new customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId
        }
      });
      
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await admin.firestore().collection('users').doc(userId).update({
        stripeCustomerId: customerId
      });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/dashboard?checkout=success`,
      cancel_url: `${request.headers.get('origin')}/pricing?checkout=cancelled`,
      metadata: {
        userId
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
  }
}
