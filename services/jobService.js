
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { storage, db } from '../config/firebase-browser'

/**
 * Guarda un objeto JSON en Firebase Storage
 * @param {Object} data - Datos a guardar
 * @param {string} path - Ruta en Firebase Storage (ej: 'analisis/jobId.json')
 */
export async function saveJsonToFirebase(data, path) {
  try {
    const jsonData = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    
    const storageRef = ref(storage, `cv-data/${path}`)
    await uploadBytes(storageRef, blob)
    
    const downloadURL = await getDownloadURL(storageRef)
    console.log(`JSON saved to Firebase: ${downloadURL}`)
    
    return downloadURL
  } catch (error) {
    console.error('Error saving JSON to Firebase:', error)
    throw error
  }
}

/**
 * Actualiza el estado de un job guardando en Firebase Storage y Firestore
 * @param {string} jobId 
 * @param {'pending'|'completed'|'failed'} status 
 * @param {string} [extractedText] - Texto extraído (opcional)
 */
export async function updateJobStatus(jobId, status, extractedText = null) {
  try {
    const payload = {
      jobId,
      status,
      updatedAt: new Date().toISOString(),
      ...(extractedText && { extractedText })
    }

    // 1. Guardar archivo JSON en Firebase Storage
    const jsonUrl = await saveJsonToFirebase(payload, `jobStatus/${jobId}.json`)

    // 2. Actualizar documento en Firestore para consultas rápidas
    const jobStatusRef = doc(db, 'jobStatus', jobId)
    await setDoc(jobStatusRef, {
      ...payload,
      jsonFileUrl: jsonUrl,
      lastUpdated: serverTimestamp()
    }, { merge: true })

    console.log(`Job status updated: ${jobId} -> ${status}`)
  } catch (error) {
    console.error('Error updating job status:', error)
    throw error
  }
}
