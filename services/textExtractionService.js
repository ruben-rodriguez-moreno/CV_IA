import { getDownloadURL } from 'firebase/storage';
import { backOff } from 'exponential-backoff';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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
 * Extract text from a PDF or DOCX file using a serverless function
 * @param {string} fileUrl - URL to the file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextAndUpdateStatus(fileUrl, docId) {
  try {
    // Cambia el estado a "processing"
    await updateAnalysisStatus(docId, 'processing');

    // Llama a la API para extraer el texto
    const response = await fetch('/api/extract-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl }),
    });

    if (!response.ok) {
      throw new Error(`Failed to extract text: ${response.statusText}`);
    }

    const { text } = await response.json();

    // Cambia el estado a "completed" y guarda el texto extraído
    await updateAnalysisStatus(docId, 'completed', text);
  } catch (error) {
    console.error('Error during text extraction:', error);

    // Cambia el estado a "failed" en caso de error
    await updateAnalysisStatus(docId, 'failed');
  }
}
