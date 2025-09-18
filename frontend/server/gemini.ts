// server/gemini.ts
import { Router } from 'express';
const router = Router();

router.post('/a', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Missing question' });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      console.error('GEMINI_API_KEY not set in process.env');
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY on server' });
    }

    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    // --- Add system prompt ---
    const systemPrompt = `
You are an AI chatbot for farmers. Users can ask any question about fertilizer, crop health, rain, market price, or carbon credits in simple language. 
Draw from all available data sources and model outputs to answer, clarify, and guide. 
Each advice card includes a "Why/How" button to trigger detailed explanations, FAQs, and follow-ups. 
Support voice and text responses in English, Hindi, and Punjabi.
`;

    const payload = {
      // The system message + user question
      // Some Gemini APIs support "messages" instead of "contents"; if your API only supports "contents", prepend the system prompt to the text
      contents: [
        { parts: [{ text: `${systemPrompt}\n\nQuestion: ${question}` }] }
      ],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.2,
      },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_KEY,
      },
      body: JSON.stringify(payload),
    });

    console.log(`Gemini HTTP ${response.status} ${response.statusText}`);

    const text = await response.text();
    if (!response.ok) {
      console.error('Gemini API returned error:', text);
      return res.status(502).json({ error: 'Gemini API failed', status: response.status });
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    const reply =
      (data?.candidates?.[0]?.content?.parts?.[0]?.text) ||
      (data?.output?.[0]?.content?.map((c: any) => c?.text || '').join('')) ||
      (data?.text) ||
      JSON.stringify(data);

    res.json({ reply });
  } catch (err) {
    console.error('/api/a unexpected error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
