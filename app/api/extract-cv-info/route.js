import { NextResponse } from 'next/server';
import { admin } from '../../../config/firebase-admin';
import OpenAI from 'openai';

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
    try {
      await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { cvText } = body;
    
    if (!cvText) {
      return NextResponse.json({ error: 'CV text is required' }, { status: 400 });
    }
    
    // Extract CV information
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
          You are an AI assistant specialized in CV/resume analysis.
          Extract the following information from the CV:
          1. Technical skills (programming languages, tools, frameworks, etc.)
          2. Work experience (company, position, dates, responsibilities)
          3. Education (institution, degree, dates)
          4. A brief professional summary

          Format your response as a valid JSON object with the following schema:
          {
            "skills": [array of strings],
            "experience": [
              {
                "company": "string",
                "position": "string",
                "startDate": "string (YYYY-MM)",
                "endDate": "string (YYYY-MM) or 'Present'",
                "description": "string"
              }
            ],
            "education": [
              {
                "institution": "string",
                "degree": "string",
                "field": "string",
                "startDate": "string (YYYY-MM)",
                "endDate": "string (YYYY-MM) or 'Present'"
              }
            ],
            "summary": "string"
          }

          Ensure the JSON is valid. Only return the JSON object, nothing else.
          `
        },
        {
          role: "user",
          content: cvText
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const cvInfo = JSON.parse(response.choices[0].message.content);
    return NextResponse.json({ cvInfo });
  } catch (error) {
    console.error('Error extracting CV information:', error);
    return NextResponse.json({ error: 'Error extracting CV information' }, { status: 500 });
  }
}