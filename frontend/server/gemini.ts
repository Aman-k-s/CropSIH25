// server/gemini.ts
import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

router.post("/a", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const apiUrl = "https://generativeai.googleapis.com/v1/models/text-bison-001:generate";

    const payload = {
      prompt: { text: question },
      maxOutputTokens: 512,
      temperature: 0.2,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return res.status(502).json({ error: "Gemini API failed", details: errText });
    }

    const data = await response.json();
    const reply =
      data?.output?.[0]?.content?.map((c: any) => c.text).join("") ||
      data?.candidates?.[0]?.content?.map((c: any) => c.text).join("") ||
      (typeof data === "string" ? data : JSON.stringify(data));

    res.json({ reply });
  } catch (err) {
    console.error("a error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
