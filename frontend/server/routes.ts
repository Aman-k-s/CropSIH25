/*import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.post('/a', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Missing question' });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

    const apiUrl = 'https://generativeai.googleapis.com/v1/models/text-bison-001:generate';

    const payload = {
      prompt: { text: question },
      maxOutputTokens: 512,
      temperature: 0.2,
    };

    const r = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GEMINI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('Gemini error:', r.status, errText);
      return res.status(502).json({ error: 'Gemini API failed', details: errText });
    }

    const data = await r.json();
    const reply =
      data?.output?.[0]?.content?.map((c: any) => c.text).join('') ||
      data?.candidates?.[0]?.content?.map((c: any) => c.text).join('') ||
      (typeof data === 'string' ? data : JSON.stringify(data));

    res.json({ reply });
  } catch (err) {
    console.error('a error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;


// server/routes.ts
import { type Express, type Request, type Response, type NextFunction } from "express";
import geminiRouter from "./gemini"; // ✅ import the server-side router

export async function registerRoutes(app: Express) {
  // Health check
  app.get("/ping", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API routes
  app.use("/api", geminiRouter);

  // Catch-all 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error-handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Express error:", err);
    res.status(status).json({ message });
  });

  return app;
}
*/

// server/routes.ts
import { type Express, type Request, type Response, type NextFunction } from "express";
import geminiRouter from "./gemini"; // ✅ import the API router

export async function registerRoutes(app: Express) {
  // Health check route
  app.get("/ping", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API routes
  app.use("/api", geminiRouter);

  // Don't add a catch-all 404 here; let frontend handle unknown routes in index.ts

  // Error-handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Express error:", err);
    res.status(status).json({ message });
  });

  return app;
}
