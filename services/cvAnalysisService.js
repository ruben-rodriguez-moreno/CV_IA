import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase-browser';
import { backOff } from 'exponential-backoff';

// Estados del análisis
export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Configuración de reintentos
const BACKOFF_CONFIG = {
  numOfAttempts: 3,
  startingDelay: 2000,
  timeMultiple: 2,
  retry: (e, attemptNumber) => {
    console.log(`Reintento #${attemptNumber}: ${e.message}`);
    return true;
  }
};

/**
 * Función principal para analizar un CV con manejo de estados
 */
export async function analyzeCv(cvText, fileName, token) {
  try {
    // Registrar análisis inicial en Firestore
    const fileId = fileName || `cv_${Date.now()}`;
    await setDoc(doc(db, 'cvAnalyses', fileId), {
      status: ANALYSIS_STATUS.PENDING,
      fileName,
      created: new Date().toISOString(),
      metadata: {
        textLength: cvText.length,
        attempts: 0
      }
    });

    // Ejecutar análisis con reintentos
    const result = await backOff(async () => {
      const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cvText, fileName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el análisis');
      }
      
      return await response.json();
    }, BACKOFF_CONFIG);

    // Actualizar estado a completado
    await updateDoc(doc(db, 'cvAnalyses', fileId), {
      status: ANALYSIS_STATUS.COMPLETED,
      analysis: result.analysis,
      completedAt: new Date().toISOString(),
      'metadata.attempts': BACKOFF_CONFIG.numOfAttempts
    });

    return result.analysis;

  } catch (error) {
    // Actualizar estado a fallido
    await updateDoc(doc(db, 'cvAnalyses', fileId), {
      status: ANALYSIS_STATUS.FAILED,
      error: error.message,
      failedAt: new Date().toISOString()
    });
    
    throw error;
  }
}

/**
 * Función mejorada para extraer información con manejo de caché
 */
export async function extractCvInformation(cvText, token) {
  const cacheKey = `extract_${hashCode(cvText)}`;
  
  try {
    // Verificar caché primero
    const cached = await getCachedAnalysis(cacheKey);
    if (cached) return cached;

    const response = await fetch('/api/extract-cv-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cvText })
    });

    if (!response.ok) throw new Error('Error en extracción');
    
    const data = await response.json();
    
    // Almacenar en caché
    await cacheAnalysisResult(cacheKey, token, data.cvInfo);
    
    return data.cvInfo;

  } catch (error) {
    console.error("Error en extracción:", error);
    throw error;
  }
}

/**
 * Función de caché mejorada
 */
export async function getCachedAnalysis(cacheKey) {
  try {
    const cacheDoc = await getDoc(doc(db, 'cvAnalysisCache', cacheKey));
    
    if (!cacheDoc.exists()) return null;
    
    const cachedData = cacheDoc.data();
    const expiresAt = new Date(cachedData.expiresAt);
    
    // Verificar si el caché ha expirado
    if (expiresAt < new Date()) {
      // Eliminar caché expirado
      await deleteDoc(doc(db, 'cvAnalysisCache', cacheKey));
      return null;
    }
    
    return cachedData;
  } catch (error) {
    console.error('Error retrieving cache:', error);
    return null;
  }
}

export async function cacheAnalysisResult(fileId, userId, analysisResult) {
  try {
    await setDoc(doc(db, 'cvAnalysisCache', fileId), {
      ...analysisResult,
      userId,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 semana
    });
    
  } catch (error) {
    console.error('Error en caché:', error);
  }
}

// Función auxiliar para generar hash
function hashCode(str) {
  return str.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
}