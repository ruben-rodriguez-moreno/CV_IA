import { getFirestore, doc, updateDoc } from 'firebase/firestore';

/**
 * Actualiza el estado de un análisis y, opcionalmente, guarda el texto extraído
 * @param {string} docId - El ID del documento en Firestore
 * @param {string} status - El nuevo estado del análisis ('processing', 'completed', 'failed')
 * @param {string} [extractedText=null] - El texto extraído del archivo (opcional)
 */
async function updateAnalysisStatus(docId, status, extractedText = null) {
  const db = getFirestore();
  const docRef = doc(db, 'cvs', docId);

  const updateData = { status };
  if (extractedText) {
    updateData.extractedText = extractedText;
  }
  await updateDoc(docRef, updateData);
}

/**
 * Extrae el texto de un archivo y actualiza el estado del análisis.
 * @param {string} fileUrl - URL del archivo (PDF o DOCX)
 * @param {string} docId - ID del documento en Firestore
 */
export async function extractTextAndUpdateStatus(fileUrl, docId) {
  try {
    // Cambia el estado a "processing"
    await updateAnalysisStatus(docId, 'processing');

    // Llama a la API para extraer el texto
    // The API will handle both text extraction and AI analysis automatically
    const response = await fetch('/api/extract-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl, jobId: docId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to extract text: ${response.statusText}`);
    }
    
    const { text } = await response.json();
    console.log('Text extraction completed successfully. AI analysis triggered automatically.');
    
    // Note: The API now handles both text extraction and AI analysis
    // No need to manually trigger AI analysis here
    
  } catch (error) {
    console.error('Error during text extraction:', error);

    // Cambia el estado a "failed" en caso de error
    await updateAnalysisStatus(docId, 'failed');
  }
}
