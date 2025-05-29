// app/api/check-upload-limits/route.js   <-- servidor
import { getFirestore, doc, getDoc } from 'firebase-admin/firestore'
import { initializeApp, cert } from 'firebase-admin/app'

const adminApp = initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL))
})
const db = getFirestore(adminApp)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return new Response('Missing userId', { status: 400 })

  // tu lógica de firebase-admin aquí
  const planDoc = await db.doc(`userPlans/${userId}`).get()
  const data = planDoc.exists ? planDoc.data() : { limit: 0 }
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
