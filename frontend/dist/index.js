// server/index.ts
import express2 from "express";

// server/gemini.ts
import { Router } from "express";
var router = Router();
var conversationHistory = /* @__PURE__ */ new Map();
var cleanupOldConversations = () => {
  const oneHourAgo = Date.now() - 60 * 60 * 1e3;
  for (const [sessionId, messages] of conversationHistory.entries()) {
    if (messages.length === 0 || messages[messages.length - 1].timestamp < oneHourAgo) {
      conversationHistory.delete(sessionId);
    }
  }
};
setInterval(cleanupOldConversations, 30 * 60 * 1e3);
router.post("/a", async (req, res) => {
  try {
    const { question, sessionId: providedSessionId, clearHistory = false, location } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });
    const currentSessionId = providedSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      console.error("GEMINI_API_KEY not set in process.env");
      return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });
    }
    if (clearHistory) {
      conversationHistory.delete(currentSessionId);
    }
    let history = conversationHistory.get(currentSessionId) || [];
    const maxMessages = 20;
    if (history.length > maxMessages) {
      history = history.slice(-maxMessages);
    }
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
    const contents = [];
    for (const message of history) {
      contents.push({
        role: message.role,
        parts: [{ text: message.text }]
      });
    }
    let currentUserMessage = question;
    contents.push({
      role: "user",
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
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify(payload)
    });
    console.log(`Gemini HTTP ${response.status} ${response.statusText}`);
    const text = await response.text();
    if (!response.ok) {
      console.error("Gemini API returned error:", text);
      return res.status(502).json({ error: "Gemini API failed", status: response.status });
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      return res.status(502).json({ error: "Invalid response format from Gemini" });
    }
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || Array.isArray(data?.output) && data.output.map(
      (o) => Array.isArray(o?.content) ? o.content.map((c) => c?.text || "").join("") : ""
    ).join("") || data?.text || "Sorry, I could not generate a proper response. Please try again.";
    const currentTime = Date.now();
    history.push({
      role: "user",
      text: question,
      timestamp: currentTime
    });
    history.push({
      role: "model",
      text: reply,
      timestamp: currentTime
    });
    conversationHistory.set(currentSessionId, history);
    res.json({
      reply,
      sessionId: currentSessionId,
      conversationLength: history.length
    });
  } catch (err) {
    console.error("/api/a unexpected error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.delete("/a/history/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  conversationHistory.delete(sessionId);
  res.json({ message: "Conversation history cleared" });
});
router.get("/a/history/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const history = conversationHistory.get(sessionId) || [];
  res.json({ history, length: history.length });
});
var gemini_default = router;

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/ping", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.use("/api", gemini_default);
  app2.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Express error:", err);
    res.status(status).json({ message });
  });
  return app2;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv from "dotenv";
dotenv.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "\u2026";
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    await registerRoutes(app);
    if (app.get("env") === "development") {
      await setupVite(app);
    } else {
      serveStatic(app);
    }
    app.use((_req, res) => {
      res.sendFile(new URL("../client/index.html", import.meta.url).pathname);
    });
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express error:", err);
      res.status(status).json({ message });
    });
    const port = parseInt(process.env.PORT || "5000", 10);
    const preferredHost = process.env.HOST || "127.0.0.1";
    log(`Attempting to bind server to ${preferredHost}:${port}`);
    const server = app.listen(port, preferredHost, () => {
      log(`Server running on http://${preferredHost}:${port}`);
    });
    server.on("error", (err) => {
      console.error("Server error on listen:", err);
      if (err?.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Please free the port or set PORT to another value.`);
        process.exit(1);
      }
      if (err?.code === "ENOTSUP") {
        console.warn(`ENOTSUP binding error on host ${preferredHost}. Trying fallback to 127.0.0.1:${port} (IPv4 localhost).`);
        try {
          const fallbackServer = app.listen(port, "127.0.0.1", () => {
            log(`Fallback server listening on http://127.0.0.1:${port}`);
          });
          fallbackServer.on("error", (e) => {
            console.error("Fallback listen failed:", e);
            process.exit(1);
          });
        } catch (e) {
          console.error("Fallback attempt threw an error:", e);
          process.exit(1);
        }
        return;
      }
      console.error("Unhandled listen error, exiting.", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
})();
