// app/api/subscription/create-checkout/route.js
import { NextResponse } from 'next/server'
import { getCheckoutUrl } from '../../../../controller/subscriptionController.js'

export async function POST(req) {
  try {
    const { planId } = await req.json();
    const url = getCheckoutUrl(planId);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
