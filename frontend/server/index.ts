/*// index.ts
import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// --- Middleware to parse request bodies ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Logging middleware for /api routes ---
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // --- Register backend routes ---
    await registerRoutes(app);

    // --- Frontend middleware ---
    if (app.get("env") === "development") {
      // Dev mode: Vite handles frontend
      await setupVite(app);
    } else {
      // Prod mode: serve static build
      serveStatic(app);
    }

    // --- Catch-all 404 (API + unknown routes not handled by frontend) ---
    app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: "Not found" });
    });

    // --- Error-handling middleware ---
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express error:", err);
      res.status(status).json({ message });
    });

    // --- Start server ---
    const port = parseInt(process.env.PORT || "5000", 10);
    app.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
  }
})();
*/


import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// --- Parse request bodies ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Logging middleware ---
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // --- Register backend API routes ---
    await registerRoutes(app);

    // --- Frontend handling ---
    if (app.get("env") === "development") {
      await setupVite(app); // Vite serves frontend
    } else {
      serveStatic(app); // Production build
    }

    // --- Catch-all for frontend routes (after Vite) ---
    app.use((_req: Request, res: Response) => {
      res.sendFile(
        new URL("../client/index.html", import.meta.url).pathname
      );
    });

    // --- Error-handling middleware ---
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express error:", err);
      res.status(status).json({ message });
    });

    // --- Start server ---
    const port = parseInt(process.env.PORT || "5000", 10);
    app.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
  }
})();
