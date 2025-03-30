import { NextResponse } from 'next/server';
import { admin } from '../../../../config/firebase-admin';
import { SUBSCRIPTION_PLANS } from '../../../../lib/stripe';
import { getServerStripe } from '../../../../lib/stripe-server';

export async function GET(request) {
  try {
    // Get Firebase token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = decodedToken.uid;
    
    // Get user subscription data from database
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    // Default to free plan if no subscription
    let plan = SUBSCRIPTION_PLANS.FREE;
    let usage = {
      current: userData.cvCount || 0,
      limit: 5,
      history: userData.cvHistory || [],
    };
    
    // If user has Stripe subscription, get details
    if (userData.stripeSubscriptionId) {
      const stripe = getServerStripe();
      const subscription = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
      
      if (subscription.status === 'active') {
        // Get the plan from subscription
        const priceId = subscription.items.data[0].price.id;
        
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
          plan = SUBSCRIPTION_PLANS.PRO;
          usage.limit = 100;
        } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
          plan = SUBSCRIPTION_PLANS.ENTERPRISE;
          usage.limit = 1000;
        }
      }
    }
    
    return NextResponse.json({
      plan,
      usage,
      billingPortalUrl: userData.stripeCustomerId ? `/api/subscription/billing-portal` : null,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Error fetching subscription status' }, { status: 500 });
  }
}
