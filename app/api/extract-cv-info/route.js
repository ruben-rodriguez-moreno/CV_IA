import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { admin } from '../../../config/firebase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_STATES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

const PROMPT_CONFIG = {
  ANALYSIS: `Eres un experto en RRHH. Analiza este CV y genera:
  1. Puntuación general (1-5)
  2. 3 fortalezas clave
  3. 3 debilidades clave
  4. Sugerencias de mejora
  Formato JSON estricto: 
  {
    "summary": { "score": number, "strengths": string[], "weaknesses": string[] },
    "suggestions": string[],
    "is_acceptable": boolean
  }`,

  EXTRACTION: `Extrae información técnica en JSON válido:
  {
    "skills": string[],
    "experience": [{
      "company": string,
      "position": string,
      "start": "YYYY-MM",
      "end": "YYYY-MM|Present",
      "achievements": string[]
    }],
    "education": [{
      "institution": string,
      "degree": string,
      "field": string,
      "years": string
    }]
  }`
};

export async function POST(request) {
  try {
    // Autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const { uid } = await admin.auth().verifyIdToken(token);

    // Procesar request
    const { cvText, fileName } = await request.json();
    if (!cvText) return NextResponse.json({ error: 'CV text required' }, { status: 400 });

    // Registrar análisis en Firestore
    const docRef = admin.firestore().collection('cvAnalyses').doc();
    await docRef.set({
      userId: uid,
      fileName,
      status: ANALYSIS_STATES.PENDING,
      created: admin.firestore.FieldValue.serverTimestamp()
    });

    try {
      // Preprocesamiento
      const cleanText = cvText
        .replace(/(\r\n|\n|\r)/gm, " ") // Normalizar saltos de línea
        .substring(0, 10000) // Limitar longitud
        .trim();

      // Llamada a OpenAI con doble prompt
      const [analysis, extraction] = await Promise.all([
        openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: PROMPT_CONFIG.ANALYSIS },
            { role: "user", content: cleanText }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        }),
        
        openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: PROMPT_CONFIG.EXTRACTION },
            { role: "user", content: cleanText }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      ]);

      // Validar y parsear respuestas
      const analysisData = JSON.parse(analysis.choices[0].message.content);
      const extractionData = JSON.parse(extraction.choices[0].message.content);

      if (!analysisData.is_acceptable || !extractionData.skills) {
        throw new Error('Invalid analysis structure');
      }

      // Actualizar Firestore
      await docRef.update({
        status: ANALYSIS_STATES.COMPLETED,
        analysis: {
          metrics: analysisData.summary,
          suggestions: analysisData.suggestions,
          technical: extractionData
        },
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return NextResponse.json({ 
        status: ANALYSIS_STATES.COMPLETED,
        analysis: analysisData,
        extraction: extractionData
      });

    } catch (error) {
      await docRef.update({
        status: ANALYSIS_STATES.FAILED,
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.error(`[CV_ERROR] ${uid.substring(0, 8)} | ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

  } catch (error) {
    console.error('[FATAL_ERROR]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}