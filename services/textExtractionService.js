import { getDownloadURL } from 'firebase/storage';
import { backOff } from 'exponential-backoff';

/**
 * Extract text from a PDF or DOCX file using a serverless function
 * @param {string} fileUrl - URL to the file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromFile(fileUrl) {
  try {
    // This function would call a serverless function that handles document parsing
    // For actual implementation, you'd need to set up a serverless function 
    // using libraries like pdf.js or docx.js to extract text
    
    // Mock implementation for now
    const extractWithRetry = async () => {
      // In a real implementation, this would be an API call to your serverless function
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
      
      const data = await response.json();
      return data.text;
    };
    
    // Use backOff for retries
    return await backOff(extractWithRetry, {
      numOfAttempts: 3,
      startingDelay: 1000,
      timeMultiple: 2,
    });
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}
