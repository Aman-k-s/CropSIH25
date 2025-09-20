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

// --- Weather utilities (small cache + fetcher) ---
const WEATHER_CACHE = new Map<string, { ts: number; summary: string }>();
const WEATHER_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function isWeatherQuestion(text: string): boolean {
  if (!text) return false;
  const qs = text.toLowerCase();
  const keywords = [
    'weather',
    'rain',
    'forecast',
    'temperature',
    'temp',
    'wind',
    'humidity',
    'sunny',
    'cloud',
    'storm',
    'precip',
    'snow',
    'drizzle',
    'heat',
    'cold',
  ];
  return keywords.some((k) => qs.includes(k));
}

async function fetchWeatherSummary(lat: number, lon: number): Promise<string | null> {
  const key = `${lat.toFixed(2)}_${lon.toFixed(2)}`; // coarse key to reuse cached summaries
  const cached = WEATHER_CACHE.get(key);
  if (cached && Date.now() - cached.ts < WEATHER_TTL_MS) {
    return cached.summary;
  }

  const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;
  if (!OPENWEATHER_KEY) {
    console.warn('OPENWEATHER_API_KEY not set');
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&units=metric&appid=${OPENWEATHER_KEY}`;
    
    console.log('OpenWeather API URL:', url.replace(OPENWEATHER_KEY, 'HIDDEN_KEY'));
    
    const resp = await fetch(url);
    console.log('OpenWeather response status:', resp.status);
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.warn('OpenWeather response not OK', resp.status, errorText);
      return null;
    }
    
    const json = await resp.json();
    console.log('OpenWeather API response:', JSON.stringify(json, null, 2));

    const cond = json?.weather?.[0]?.description || 'unknown conditions';
    const temp = json?.main?.temp;
    const feels = json?.main?.feels_like;
    const humidity = json?.main?.humidity;
    const wind = json?.wind?.speed;
    const city = json?.name;

    const parts = [];
    if (city) parts.push(`Location: ${city}`);
    parts.push(`Conditions: ${cond}`);
    if (temp !== undefined) parts.push(`Temp: ${temp}°C`);
    if (feels !== undefined) parts.push(`Feels: ${feels}°C`);
    if (humidity !== undefined) parts.push(`Humidity: ${humidity}%`);
    if (wind !== undefined) parts.push(`Wind: ${wind} m/s`);

    const summary = parts.join('. ');
    console.log('Generated weather summary:', summary);
    
    WEATHER_CACHE.set(key, { ts: Date.now(), summary });
    return summary;
  } catch (err) {
    console.error('Failed to fetch OpenWeather:', err);
    return null;
  }
}

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

    // Fetch weather data every time if location is provided
    let weatherContext: string | null = null;
    if (
      location &&
      typeof location.lat === 'number' &&
      typeof location.lon === 'number'
    ) {
      weatherContext = await fetchWeatherSummary(Number(location.lat), Number(location.lon));
      console.log("SEE HERE BROHHH");
      console.log(weatherContext);
    }

    // Build system instruction
    const systemInstruction = {
      parts: [
        {
          text: `You are an expert agricultural assistant and chatbot specifically designed to help farmers and agricultural professionals. Your primary responsibilities include:

CORE EXPERTISE:
- Crop management and cultivation techniques
- Fertilizer recommendations for specific crops and soil conditions
- Plant disease identification and treatment solutions
- Pest control strategies (integrated pest management)
- Soil health assessment and improvement
- Weather impact on crops and farming decisions
- Market prices and agricultural economics
- Carbon credits and sustainable farming practices
- Irrigation and water management
- Seasonal planting and harvesting guidance

CONVERSATION CONTEXT:
- You have access to the conversation history to provide contextual responses.
- Reference previous questions and answers when relevant.
- Build upon earlier discussions to provide more personalized advice.

WEATHER DATA INTEGRATION:
- You receive live weather data for the user's location automatically
- NEVER mention "EXTERNAL_WEATHER_DATA" in your responses - this is internal system data
- Always incorporate current weather conditions into your agricultural advice naturally
- Focus on farming implications of the weather, such as:
  - Heat stress warnings for crops and livestock
  - Irrigation needs based on temperature and humidity
  - Optimal timing for field operations
  - Disease/pest pressure based on conditions
  - Protection measures needed
- Keep weather references brief and farming-focused

RESPONSE GUIDELINES:
- Always respond in the same language the user asks their question in.
- Provide practical, actionable advice that farmers can implement.
- Keep responses concise but comprehensive (aim for 2-4 sentences unless more detail is needed).
- Use simple, clear language avoiding overly technical jargon.
- When discussing chemicals or treatments, always emphasize safety precautions.
- Prioritize sustainable and environmentally friendly farming methods.
- If you're uncertain about specific regional conditions, ask for location details.
- For market prices, acknowledge that prices vary by location and time.

RESPONSE FORMAT:
- Use plain text with no markdown formatting.
- Structure information clearly with natural paragraph breaks.
- Include specific measurements, timing, or quantities when relevant.
- End with actionable next steps when appropriate.

FOCUS AREAS:
Stay focused on agricultural topics. If asked about non-farming subjects, politely redirect: "I'm specialized in agricultural assistance. Could you ask me something related to farming, crops, or agricultural practices instead?"

Remember: Your goal is to help improve agricultural productivity, sustainability, and farmer success through expert guidance. Use the conversation history to provide more personalized and contextual advice.`
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
    if (weatherContext) {
      currentUserMessage = `EXTERNAL_WEATHER_DATA: ${weatherContext}\n\n${question}`;
    }

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