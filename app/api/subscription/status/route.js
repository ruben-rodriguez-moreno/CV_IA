// app/api/subscription/status/route.js
import { NextResponse } from 'next/server';
import { admin } from '../../../../config/firebase-admin';

export async function GET(req) {
  // 1) Chequear que venga un Bearer token
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const idToken = auth.replace('Bearer ', '');

  try {
    // 2) Verificar el ID token y obtener los claims
    //    verifyIdToken devuelve un objeto con uid + todos los custom claims
    const decoded = await admin.auth().verifyIdToken(idToken);

    // 3) Leer el claim
    const active = !!decoded.subscriptionActive;

    // 4) Devolver el plan
    //    Si quieres diferenciar Pro/Enterprise, podrías ampliar
    //    el claim (p.e. decoded.subscriptionPlan = 'pro'|'enterprise').
    const plan = active ? 'paid' : 'free';

    return NextResponse.json({ plan });
  } catch (err) {
    console.error('Error en /api/subscription/status:', err);
    return NextResponse.json(
      { error: 'Could not fetch subscription status' },
      { status: 500 }
    );
  }
}
