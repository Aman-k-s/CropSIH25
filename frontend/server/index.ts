import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

import dotenv from 'dotenv';
dotenv.config();


const app = express();

// --- Parse request bodies ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Logging middleware ---
app.use((req, res, next) => {
  const start = Date.no ();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).json = function (bodyJson: any, ...args: any[]) {
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
      res.sendFile(new URL("../client/index.html", import.meta.url).pathname);
    });

    // --- Error-handling middleware ---
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express error:", err);
      res.status(status).json({ message });
    });

    // --- Start server with IPv4-first binding and graceful fallback ---
    const port = parseInt(process.env.PORT || "5000", 10);
    // Prefer explicit IPv4 host (works on Windows/containers). Allow override via HOST env.
    const preferredHost = process.env.HOST || "127.0.0.1";
    log(`Attempting to bind server to ${preferredHost}:${port}`);

    // Start initial server attempt
    const server = app.listen(port, preferredHost, () => {
      log(`Server running on http://${preferredHost}:${port}`);
    });

    // Attach runtime error handler to attempt fallback if needed
    server.on("error", (err: any) => {
      console.error("Server error on listen:", err);

      // Address already in use
      if (err?.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Please free the port or set PORT to another value.`);
        process.exit(1);
      }

      // ENOTSUP often means binding to IPv6 (::1) is not supported on this host.
      if (err?.code === "ENOTSUP") {
        console.warn(`ENOTSUP binding error on host ${preferredHost}. Trying fallback to 127.0.0.1:${port} (IPv4 localhost).`);
        try {
          const fallbackServer = app.listen(port, "127.0.0.1", () => {
            log(`Fallback server listening on http://127.0.0.1:${port}`);
          });
          fallbackServer.on("error", (e: any) => {
            console.error("Fallback listen failed:", e);
            process.exit(1);
          });
        } catch (e) {
          console.error("Fallback attempt threw an error:", e);
          process.exit(1);
        }
        return;
      }

      // Any other error -> exit with diagnostics
      console.error("Unhandled listen error, exiting.", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
})();
