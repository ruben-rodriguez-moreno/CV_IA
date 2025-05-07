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

function timeoutPromise(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function POST(request) {
  console.log("[ANÁLISIS] Iniciando proceso de análisis de CV");

  try {
    // Verificación de autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("[ERROR] Cabecera de autorización faltante");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log(`[AUTH] Usuario verificado: ${decodedToken.uid}`);
    } catch (error) {
      console.error("[ERROR] Token inválido:", error.message);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Procesar cuerpo de la solicitud
    const { cvText, fileName } = await request.json();
    if (!cvText) {
      console.error("[ERROR] Texto de CV no proporcionado");
      return NextResponse.json({ error: 'CV text is required' }, { status: 400 });
    }

    // Crear documento inicial en Firestore
    const fileId = fileName || Date.now().toString();
    const analysisRef = admin.firestore().collection('cv-analyses').doc(fileId);
    
    await analysisRef.set({
      userId: decodedToken.uid,
      fileName,
      status: ANALYSIS_STATES.PENDING,
      created: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        charsReceived: cvText.length
      }
    });

    // Preprocesar texto del CV
    const MAX_CV_LENGTH = 8000;
    const cleanText = cvText
      .replace(/\s+/g, ' ')
      .substring(0, MAX_CV_LENGTH)
      .trim();

    console.log(`[PROCESO] Texto procesado (${cleanText.length} caracteres)`);

    // Llamada a OpenAI con manejo mejorado
    let analysisResult;
    try {
      console.log("[OPENAI] Iniciando análisis con GPT-4");
      const response = await timeoutPromise(
        openai.chat.completions.create({
          model: "gpt-4-1106-preview",
          messages: [
            { 
              role: "system", 
              content: `Extrae información estructurada del CV en formato JSON válido.
                        Campos requeridos: nombre, edad, email, teléfono, 
                        experiencia (array), educación (array), habilidades (array), idiomas (array).
                        Usar "No disponible" para campos faltantes.`
            },
            { 
              role: "user", 
              content: `CV para análisis:\n${cleanText}` 
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 2000
        }),
        30000 // 30 segundos de timeout
      );

      analysisResult = JSON.parse(response.choices[0].message.content);
      console.log("[OPENAI] Análisis completado correctamente");

      // Validación básica de estructura
      if (!analysisResult.habilidades || !Array.isArray(analysisResult.habilidades)) {
        throw new Error("Estructura de análisis inválida");
      }

    } catch (openaiError) {
      console.error("[OPENAI ERROR]", openaiError);
      await analysisRef.update({
        status: ANALYSIS_STATES.FAILED,
        error: openaiError.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      throw openaiError;
    }

    // Actualizar estado a completado
    await analysisRef.update({
      status: ANALYSIS_STATES.COMPLETED,
      analysis: analysisResult,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        ...analysisResult.metadata,
        modelUsed: "gpt-4-1106-preview",
        charsProcessed: cleanText.length
      }
    });

    console.log("[FIRESTORE] Análisis almacenado exitosamente");
    return NextResponse.json({ 
      status: ANALYSIS_STATES.COMPLETED,
      analysis: analysisResult 
    });

  } catch (error) {
    console.error("[ERROR CRÍTICO]", {
      message: error.message,
      stack: error.stack,
      requestDetails: {
        fileName: fileName || 'N/A',
        user: decodedToken?.uid || 'No autenticado'
      }
    });

    // Registrar error en Firestore
    if (analysisRef) {
      await analysisRef.update({
        status: ANALYSIS_STATES.FAILED,
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return NextResponse.json(
      { 
        error: "Error procesando el CV",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}