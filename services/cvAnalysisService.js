import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase-browser';

/**
 * Main function to analyze a CV
 * @param {string} cvText - The text content of the CV
 * @param {string} fileName - Name of the CV file
 * @param {string} token - Firebase authentication token
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeCv(cvText, fileName, token) {
  try {
    const response = await fetch('/api/analyze-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cvText, fileName }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze CV');
    }
    
    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("Error analyzing CV:", error);
    throw error;
  }
}

/**
 * Extract structured information from CV text
 * @param {string} cvText - The text content of the CV
 * @param {string} token - Firebase auth token
 * @returns {Promise<Object>} - Structured CV data
 */
export async function extractCvInformation(cvText, token) {
  try {
    const response = await fetch('/api/extract-cv-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cvText }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to extract CV information');
    }
    
    const data = await response.json();
    return data.cvInfo;
  } catch (error) {
    console.error("Error extracting CV information:", error);
    throw error;
  }
}

/**
 * Generate embeddings for semantic search
 * @param {string} text - Text to generate embeddings for
 * @param {string} token - Firebase auth token
 * @returns {Promise<Array>} - Vector embeddings
 */
export async function generateEmbeddings(text, token) {
  try {
    const response = await fetch('/api/generate-embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate embeddings');
    }
    
    const data = await response.json();
    return data.embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return null;
  }
}

/**
 * Get cached analysis result from Firestore
 * @param {string} fileId - CV file ID
 * @returns {Promise<Object|null>} - Cached analysis or null if not found
 */
export async function getCachedAnalysis(fileId) {
  try {
    const docRef = doc(db, 'cvAnalysis', fileId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.warn('Error retrieving cached analysis:', error);
    return null;
  }
}

/**
 * Cache analysis result in Firestore
 * @param {string} fileId - CV file ID
 * @param {string} userId - User ID who uploaded the CV
 * @param {Object} analysisResult - The analysis result to cache
 */
export async function cacheAnalysisResult(fileId, userId, analysisResult) {
  try {
    await setDoc(doc(db, 'cvAnalysis', fileId), {
      ...analysisResult,
      userId,
      cachedAt: new Date().toISOString(),
    });
    console.log('CV analysis cached successfully');
  } catch (error) {
    console.error('Error caching CV analysis:', error);
  }
}

/**
 * Compare a job description with a CV using embeddings via API
 * @param {string} jobDescription - Job description text
 * @param {string} cvText - CV text content
 * @param {string} token - Firebase authentication token
 * @returns {Promise<number>} - Similarity score (0-1)
 */
export async function calculateJobMatch(jobDescription, cvText, token) {
  try {
    const response = await fetch('/api/job-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ jobDescription, cvText }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to calculate job match');
    }
    
    const data = await response.json();
    return data.matchScore;
  } catch (error) {
    console.error('Error calculating job match:', error);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vec1 - First vector
 * @param {Array} vec2 - Second vector
 * @returns {number} - Similarity score (0-1)
 */
export function calculateCosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }
  
  return dotProduct / (mag1 * mag2);
}
