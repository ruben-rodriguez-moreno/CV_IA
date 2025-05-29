// app/api/subscription/manage/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Lee el customerId de Firestore
  const userRef = doc(db, 'users', session.user.id);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const { stripeCustomerId } = userSnap.data();
  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
  }

  // Crea la sesión de portal
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
  });

  return NextResponse.json({ url: portalSession.url });
}
