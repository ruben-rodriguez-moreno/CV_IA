import { admin } from '../../config/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cvId } = req.body;
  if (!cvId) {
    return res.status(400).json({ error: 'Missing cvId' });
  }

  try {
    // Get the CV document
    const db = admin.firestore();
    const cvRef = db.collection('cvs').doc(cvId);
    const cvDoc = await cvRef.get();

    if (!cvDoc.exists) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const cvData = cvDoc.data();

    // Check if it's a text-only CV
    if (cvData.analysisType !== 'text_only') {
      return res.status(400).json({ error: 'CV already has AI analysis or is not text-only' });
    }

    // Check if we have extracted text
    if (!cvData.extractedText) {
      return res.status(400).json({ error: 'No extracted text available for analysis' });
    }    // Update the CV to processing status
    await cvRef.update({
      status: 'processing',
      analysisType: 'ai_analysis',
      aiAnalysisStarted: admin.firestore.FieldValue.serverTimestamp()
    });    // Call the AI analysis function
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const aiResponse = await fetch(`${baseUrl}/api/extract-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cvId: cvId,
        extractedText: cvData.extractedText,
        triggerAI: true
      })
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to trigger AI analysis');
    }

    return res.status(200).json({ 
      message: 'AI analysis triggered successfully',
      cvId 
    });

  } catch (error) {
    console.error('Error triggering AI analysis:', error);
    
    // Update CV status to failed if needed
    try {
      const db = admin.firestore();
      await db.collection('cvs').doc(cvId).update({
        status: 'failed',
        error: error.message,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      console.error('Error updating failed status:', updateError);
    }

    return res.status(500).json({ 
      error: 'Failed to trigger AI analysis', 
      details: error.message 
    });
  }
}
