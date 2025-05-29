import pdfParse from 'pdf-parse'
import { admin } from '../../config/firebase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { fileUrl, jobId } = req.body
  if (!fileUrl || !jobId) {
    return res.status(400).json({ error: 'Missing fileUrl or jobId' })
  }
  try {
    // 1) Extrae el PDF
    const response = await fetch(fileUrl)
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const data = await pdfParse(buffer)

    // 2) Guarda resultado en Firebase Storage usando Admin SDK
    const bucket = admin.storage().bucket()
    const fileName = `cv-data/analisis/${jobId}.json`
    const file = bucket.file(fileName)
    
    await file.save(JSON.stringify(data, null, 2), {
      metadata: {
        contentType: 'application/json',
      },
    })

    // 3) Guarda estado del job en Firebase Storage
    const jobStatusData = {
      jobId,
      status: 'completed',
      updatedAt: new Date().toISOString(),
      extractedText: data.text
    }
    
    const statusFileName = `cv-data/jobStatus/${jobId}.json`
    const statusFile = bucket.file(statusFileName)
    
    await statusFile.save(JSON.stringify(jobStatusData, null, 2), {
      metadata: {
        contentType: 'application/json',
      },
    })

    // 4) También guardamos en Firestore para consultas rápidas
    const db = admin.firestore()
    await db.collection('jobStatus').doc(jobId).set({
      ...jobStatusData,
      jsonFileUrl: `gs://${bucket.name}/${fileName}`,
      statusFileUrl: `gs://${bucket.name}/${statusFileName}`,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`CV analysis saved to Firebase: ${fileName}`)

    // 5) Devuelve el texto extraído
    return res.status(200).json({ text: data.text })
  } catch (error) {
    console.error('Error extracting text:', error)

    // Marca como FAILED usando Firebase Admin
    try {
      const jobStatusData = {
        jobId,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        error: error.message
      }
      
      const bucket = admin.storage().bucket()
      const statusFileName = `cv-data/jobStatus/${jobId}.json`
      const statusFile = bucket.file(statusFileName)
      
      await statusFile.save(JSON.stringify(jobStatusData, null, 2), {
        metadata: {
          contentType: 'application/json',
        },
      })

      // También actualizamos Firestore
      const db = admin.firestore()
      await db.collection('jobStatus').doc(jobId).set({
        ...jobStatusData,
        statusFileUrl: `gs://${bucket.name}/${statusFileName}`,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      })
    } catch (e) {
      console.error('Error updating job status to failed:', e)
    }

    return res.status(500).json({ error: 'Failed to extract text', details: error.message })
  }
}
