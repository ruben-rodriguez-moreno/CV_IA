import pdfParse from 'pdf-parse'
import { admin } from '../../config/firebase-admin'

/**
 * Helper function to clean and separate skills array
 * @param {any} skills - The skills data from AI analysis
 * @returns {string[]} - Cleaned array of individual skills
 */
function cleanSkillsArray(skills) {
  if (!skills) return [];
  
  if (Array.isArray(skills)) {
    // If it's already an array, clean each element
    return skills.flatMap(skill => {
      if (typeof skill === 'string') {
        // Split concatenated skills if they exist
        return skill.split(/[,;\/\|\+&]/)
          .map(s => s.trim())
          .filter(s => s.length > 1 && s.length < 50) // Filter out empty and too long strings
          .filter(s => !s.match(/^\d+$/)) // Filter out standalone numbers
      }
      return [];
    });
  } else if (typeof skills === 'string') {
    // If it's a string, split it into individual skills
    return skills.split(/[,;\/\|\+&\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 50)
      .filter(s => !s.match(/^\d+$/)); // Filter out standalone numbers
  }
  
  return [];
}

/**
 * Triggers AI analysis for the extracted CV text
 * @param {string} extractedText - The extracted text from the CV
 * @param {string} docId - ID del documento en Firestore
 */
export async function triggerAIAnalysis(extractedText, docId) {
  try {
    console.log(`[AI_TRIGGER] Starting AI analysis for CV: ${docId}`)
    
    // Get the CV document to get the fileName and userId
    const db = admin.firestore()
    const docRef = db.collection('cvs').doc(docId)
    const docSnap = await docRef.get()
    
    if (!docSnap.exists) {
      throw new Error('CV document not found')
    }
    
    const cvData = docSnap.data()
    const fileName = cvData.fileName || 'unnamed_cv'
    const userId = cvData.userId
    
    if (!userId) {
      throw new Error('No userId found in CV document')
    }
    
    // Create a custom token for the user using Firebase Admin
    const customToken = await admin.auth().createCustomToken(userId)
    
    // Update status to processing for AI analysis
    await docRef.update({ 
      status: 'processing', 
      analysisType: 'ai_analysis',
      aiAnalysisStarted: admin.firestore.FieldValue.serverTimestamp()
    })
      // Sign in with custom token to get ID token (this will be done server-side)
    // For server-to-server communication, we'll create the request directly
    const analyzeUrl = process.env.NODE_ENV === 'production' 
      ? `${process.env.NEXTAUTH_URL}/api/analyze-cv`
      : 'http://localhost:3002/api/analyze-cv'
    
    // Instead of using the analyze-cv route, let's call OpenAI directly here
    // to avoid circular API calls and authentication issues
    const { default: OpenAI } = await import('openai')
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    console.log("[OPENAI] Starting analysis with GPT-4")
      // Preprocess CV text
    const MAX_CV_LENGTH = 8000
    const cleanText = extractedText
      .replace(/\s+/g, ' ')
      .substring(0, MAX_CV_LENGTH)
      .trim();
      
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        { 
          role: "system",          content: `Eres un experto analizador de CVs. Analiza el CV y extrae información estructurada en formato JSON válido.

ESTRUCTURA REQUERIDA (OBLIGATORIA):
{
  "nombre": "nombre completo del candidato",
  "edad": "edad si está disponible o 'No disponible'",
  "email": "email del candidato o 'No disponible'", 
  "telefono": "teléfono del candidato o 'No disponible'",
  "habilidades": ["JavaScript", "Python", "React", "Node.js", "HTML", "CSS"],
  "experiencia": [
    {
      "empresa": "Nombre de la empresa",
      "puesto": "Título del puesto",
      "periodo": "2020-2023",
      "descripcion": "Descripción de responsabilidades y logros"
    }
  ],
  "educacion": [
    {
      "institucion": "Universidad o institución",
      "titulo": "Título obtenido o carrera",
      "periodo": "2018-2022",
      "descripcion": "Detalles adicionales sobre los estudios"
    }
  ],
  "idiomas": ["Español", "Inglés", "Francés"]
}

REGLAS CRÍTICAS PARA HABILIDADES:
1. SIEMPRE devuelve un JSON válido con la estructura exacta mostrada arriba
2. IMPORTANTE: Las habilidades DEBEN ser elementos separados en el array
3. NUNCA concatenes habilidades como "JavaScript, Python, React"
4. CORRECTO: ["JavaScript", "Python", "React", "Node.js", "HTML", "CSS"]
5. INCORRECTO: ["JavaScript, Python, React"] o ["JavaScript Python React"]
6. Si encuentras habilidades listadas con comas, sepáralas en elementos individuales
7. Cada habilidad debe ser una tecnología, lenguaje o competencia específica
8. Para arrays vacíos usa [], para strings vacíos usa "No disponible"

REGLAS ADICIONALES:
9. Para experiencia: identifica claramente empresas, puestos y períodos de trabajo
10. Para educación: identifica instituciones educativas, títulos/carreras y períodos  
11. NO inventes información que no esté en el CV
12. Mantén los nombres de campos exactamente como se muestra
13. NO agregues explicaciones, solo el JSON
14. Ejemplo correcto de habilidades: ["React", "Vue.js", "Angular", "JavaScript", "TypeScript", "Python", "Django", "PostgreSQL"]`
        },
        { 
          role: "user", 
          content: `Analiza este CV y extrae la información:\n\n${cleanText}` 
        }
      ],      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 4000
    });
      const analysisResult = JSON.parse(response.choices[0].message.content)
    console.log("[OPENAI] Analysis completed successfully")
    console.log("[OPENAI] Raw analysis result:", JSON.stringify(analysisResult, null, 2))
    console.log("[OPENAI] Raw skills from AI:", analysisResult.habilidades)
    
    // Validate and clean the analysis result
    const cleanedResult = {
      nombre: typeof analysisResult.nombre === 'string' ? analysisResult.nombre : 'No disponible',
      edad: typeof analysisResult.edad === 'string' ? analysisResult.edad : 'No disponible',
      email: typeof analysisResult.email === 'string' ? analysisResult.email : 'No disponible',
      telefono: typeof analysisResult.telefono === 'string' ? analysisResult.telefono : 'No disponible',
      habilidades: cleanSkillsArray(analysisResult.habilidades),
      experiencia: Array.isArray(analysisResult.experiencia) ? analysisResult.experiencia : [],
      educacion: Array.isArray(analysisResult.educacion) ? analysisResult.educacion : [],      idiomas: Array.isArray(analysisResult.idiomas) ? analysisResult.idiomas : []
    }
    
    console.log("[SKILLS] Cleaned skills:", cleanedResult.habilidades)
    console.log("[OPENAI] Cleaned analysis result:", JSON.stringify(cleanedResult, null, 2))
    
    // Validation - check for required fields using cleaned result
    const hasSkills = cleanedResult.habilidades && cleanedResult.habilidades.length > 0
    const hasExperience = cleanedResult.experiencia && cleanedResult.experiencia.length > 0
    const hasEducation = cleanedResult.educacion && cleanedResult.educacion.length > 0
    
    if (!hasSkills && !hasExperience && !hasEducation) {
      console.warn("[OPENAI] Warning: Analysis result seems incomplete, but proceeding...")
    }
      // Normalize field names to English for frontend compatibility
    const normalizedResult = {
      name: cleanedResult.nombre || "No disponible",
      age: cleanedResult.edad || "No disponible", 
      email: cleanedResult.email || "No disponible",
      phone: cleanedResult.telefono || "No disponible",
      skills: cleanedResult.habilidades || [],
      experience: cleanedResult.experiencia || [],
      education: cleanedResult.educacion || [],
      languages: cleanedResult.idiomas || []
    };
    
    console.log(`[NORMALIZE] Final normalized result:`, JSON.stringify(normalizedResult, null, 2))
    
    // Update the CV document with the analysis results
    await docRef.update({
      status: 'completed',
      analysis: normalizedResult,
      aiAnalysisCompleted: admin.firestore.FieldValue.serverTimestamp(),
      analysisType: 'ai_analysis',
      metadata: {
        modelUsed: "gpt-4-1106-preview",
        charsProcessed: cleanText.length,
        originalResponse: cleanedResult, // Keep cleaned version for debugging
        rawResponse: analysisResult // Keep absolutely raw version too
      }
    })
    
    console.log(`[AI_TRIGGER] AI analysis completed for CV: ${fileName}`)
    
  } catch (error) {
    console.error('[AI_TRIGGER] Error during AI analysis:', error)
    
    // Update status to failed
    try {
      const db = admin.firestore()
      const docRef = db.collection('cvs').doc(docId)
      await docRef.update({
        status: 'failed',
        error: error.message,
        aiAnalysisFailed: admin.firestore.FieldValue.serverTimestamp()
      })
    } catch (updateError) {
      console.error('[AI_TRIGGER] Error updating failed status:', updateError)
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Handle trigger AI analysis request
  if (req.body.triggerAI && req.body.cvId && req.body.extractedText) {
    try {
      await triggerAIAnalysis(req.body.extractedText, req.body.cvId);
      return res.status(200).json({ 
        message: 'AI analysis triggered successfully',
        cvId: req.body.cvId 
      });
    } catch (error) {
      console.error('Error triggering AI analysis:', error);
      return res.status(500).json({ 
        error: 'Failed to trigger AI analysis', 
        details: error.message 
      });
    }
  }

  // Handle regular text extraction
  const { fileUrl, jobId, textOnly = false } = req.body
  if (!fileUrl || !jobId) {
    return res.status(400).json({ error: 'Missing fileUrl or jobId' })
  }
  
  try {
    // 1) Extract the PDF text
    const response = await fetch(fileUrl)
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const data = await pdfParse(buffer)

    // 2) Save result in Firebase Storage using Admin SDK
    const bucket = admin.storage().bucket()
    const fileName = `cv-data/analisis/${jobId}.json`
    const file = bucket.file(fileName)
    
    await file.save(JSON.stringify(data, null, 2), {
      metadata: {
        contentType: 'application/json',
      },
    })

    // 3) Save job status in Firebase Storage
    const jobStatusData = {
      jobId,
      status: textOnly ? 'text_extracted' : 'completed',
      updatedAt: new Date().toISOString(),
      extractedText: data.text,
      textOnly: textOnly || false
    }
    
    const statusFileName = `cv-data/jobStatus/${jobId}.json`
    const statusFile = bucket.file(statusFileName)
    
    await statusFile.save(JSON.stringify(jobStatusData, null, 2), {
      metadata: {
        contentType: 'application/json',
      },
    })

    // 4) Update Firestore with extracted text and appropriate status
    const db = admin.firestore()
    const cvRef = db.collection('cvs').doc(jobId)
    
    await cvRef.update({
      status: textOnly ? 'text_extracted' : 'processing',
      extractedText: data.text,
      textExtractionCompleted: admin.firestore.FieldValue.serverTimestamp(),
      analysisType: textOnly ? 'text_only' : 'ai_analysis',
      jsonFileUrl: `gs://${bucket.name}/${fileName}`,
      statusFileUrl: `gs://${bucket.name}/${statusFileName}`,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`CV text extraction ${textOnly ? '(text-only)' : '(with AI analysis)'} saved to Firebase: ${fileName}`)

    // 5) Only trigger AI analysis if not text-only mode
    if (!textOnly) {
      await triggerAIAnalysis(data.text, jobId)
    } else {
      console.log(`Text-only extraction completed for CV: ${jobId}`)
    }

    // 6) Return the extracted text
    return res.status(200).json({ text: data.text, textOnly })
  } catch (error) {
    console.error('Error extracting text:', error)

    // Mark as FAILED using Firebase Admin
    try {
      const jobStatusData = {
        jobId,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        error: error.message,
        textOnly: textOnly || false
      }
      
      const bucket = admin.storage().bucket()
      const statusFileName = `cv-data/jobStatus/${jobId}.json`
      const statusFile = bucket.file(statusFileName)
      
      await statusFile.save(JSON.stringify(jobStatusData, null, 2), {
        metadata: {
          contentType: 'application/json',
        },
      })

      // Also update Firestore
      const db = admin.firestore()
      await db.collection('jobStatus').doc(jobId).set({
        ...jobStatusData,
        statusFileUrl: `gs://${bucket.name}/${statusFileName}`,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      })
      
      // Update CV document status
      await db.collection('cvs').doc(jobId).update({
        status: 'failed',
        error: error.message,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      })
    } catch (e) {
      console.error('Error updating job status to failed:', e)
    }

    return res.status(500).json({ error: 'Failed to extract text', details: error.message })
  }
}
