import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { admin } from '../../../config/firebase-admin';

// Initialize OpenAI client (server-side only)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { cvText, fileName } = body;
    
    if (!cvText) {
      return NextResponse.json({ error: 'CV text is required' }, { status: 400 });
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are an expert CV analyst. Analyze the provided CV and provide feedback on structure, content, and improvements." 
        },
        { 
          role: "user", 
          content: `Analyze this CV:\n\n${cvText}` 
        }
      ],
    });
    
    const analysis = response.choices[0].message.content;
    
    // Store analysis in Firestore
    if (fileName) {
      await admin.firestore().collection('cv-analyses').add({
        userId: decodedToken.uid,
        fileName,
        analysis,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing CV:', error);
    return NextResponse.json({ error: 'Error analyzing CV' }, { status: 500 });
  }
}