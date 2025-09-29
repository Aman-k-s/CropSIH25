// server/gemini.ts (Express router) — TypeScript-friendly
// Drop-in file for the server side (place under your server routes).
// Requires environment variables: GEMINI_API_KEY and OPENWEATHER_API_KEY
// Node 18+ recommended (fetch available). If not, install node-fetch and replace fetch accordingly.

import { Router, Request, Response } from 'express';
const router = Router();

// In-memory storage for conversation history (use Redis/database in production)
const conversationHistory = new Map<
  string,
  Array<{ role: 'user' | 'model'; text: string; timestamp: number }>
>();

// Clean up old conversations (run periodically)
const cleanupOldConversations = () => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [sessionId, messages] of conversationHistory.entries()) {
    if (messages.length === 0 || messages[messages.length - 1].timestamp < oneHourAgo) {
      conversationHistory.delete(sessionId);
    }
  }
};

// Clean up every 30 minutes
setInterval(cleanupOldConversations, 30 * 60 * 1000);

// --- POST /api/a handler ---
router.post('/a', async (req: Request, res: Response) => {
  try {
    const { question, sessionId: providedSessionId, clearHistory = false, location } = req.body;

    if (!question) return res.status(400).json({ error: 'Missing question' });

    // Use provided sessionId or generate one
    const currentSessionId =
      providedSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      console.error('GEMINI_API_KEY not set in process.env');
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY on server' });
    }

    // Clear history if requested
    if (clearHistory) {
      conversationHistory.delete(currentSessionId);
    }

    // Get or initialize conversation history
    let history = conversationHistory.get(currentSessionId) || [];

    // Limit history to last 10 exchanges (20 messages) to stay within token limits
    const maxMessages = 20;
    if (history.length > maxMessages) {
      history = history.slice(-maxMessages);
    }

    // Build system instruction
    const systemInstruction = {
      parts: [
        {
          text: `You are an agricultural assistant chatbot helping farmers and professionals.
Core expertise: crop management, fertilizers, plant disease and pest control, soil health, irrigation, seasonal guidance, weather impact, market prices, carbon credits, and sustainable practices.
Guidelines:
Always reply in the language of the user.
Give clear, practical, and concise advice (2 to 4 sentences).
Avoid jargon; keep explanations simple.
Emphasize safety and sustainable methods.
For market prices, note variation by region and time.
Ask for location details if conditions differ by region.
Redirect politely if asked about non-agriculture topics.
Goal: Improve farm productivity, sustainability, and farmer success with actionable guidance.`
        }
      ]
    };

    // Build contents array with conversation history
    const contents: Array<any> = [];

    // Add conversation history (user & model messages only)
    for (const message of history) {
      contents.push({
        role: message.role,
        parts: [{ text: message.text }]
      });
    }

    // Prepare current user message with weather context if available
    let currentUserMessage = question;

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: currentUserMessage }]
    });

    const payload = {
      systemInstruction,
      contents,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.2,
        topP: 0.8,
        topK: 40
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    const apiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_KEY
      },
      body: JSON.stringify(payload)
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
      console.error('Failed to parse Gemini response as JSON:', e);
      return res.status(502).json({ error: 'Invalid response format from Gemini' });
    }

    // Extract the response text (robust handling of variant response shapes)
    const reply =
      (data?.candidates?.[0]?.content?.parts?.[0]?.text) ||
      (Array.isArray(data?.output) &&
        data.output
          .map((o: any) =>
            Array.isArray(o?.content) ? o.content.map((c: any) => c?.text || '').join('') : ''
          )
          .join('')) ||
      data?.text ||
      'Sorry, I could not generate a proper response. Please try again.';

    // Update conversation history
    const currentTime = Date.now();

    // Add user message to history (store original question without weather data)
    history.push({
      role: 'user',
      text: question,
      timestamp: currentTime
    });

    // Add model response to history
    history.push({
      role: 'model',
      text: reply,
      timestamp: currentTime
    });

    // Save updated history
    conversationHistory.set(currentSessionId, history);

    res.json({
      reply,
      sessionId: currentSessionId,
      conversationLength: history.length
    });
  } catch (err) {
    console.error('/api/a unexpected error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Optional: Add endpoint to clear conversation history
router.delete('/a/history/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  conversationHistory.delete(sessionId);
  res.json({ message: 'Conversation history cleared' });
});

// Optional: Add endpoint to get conversation history
router.get('/a/history/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const history = conversationHistory.get(sessionId) || [];
  res.json({ history, length: history.length });
});

export default router;