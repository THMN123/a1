import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { WebhookHandlers } from './webhookHandlers';

const app = express();
const httpServer = createServer(app);

// Export app for Vercel at module level
export default app;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Stripe webhook route - MUST be before express.json()
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('Webhook body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// Now apply JSON middleware for all other routes
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint - shows env config (only in non-production for security)
app.get("/debug/env", (_req, res) => {
  if (process.env.NODE_ENV === "production" && !process.env.DEBUG_ENV) {
    return res.status(403).json({ error: "Debug endpoint disabled in production" });
  }
  
  res.status(200).json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    SUPABASE_URL: process.env.SUPABASE_URL ? "SET" : "MISSING",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "SET" : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
  });
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('[Server] Starting initialization...');
    console.log('[Server] NODE_ENV:', process.env.NODE_ENV);
    console.log('[Server] VERCEL:', process.env.VERCEL);
    
    await registerRoutes(httpServer, app);
    console.log('[Server] Routes registered');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('[Server] Express error:', err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      console.log('[Server] Setting up static file serving');
      try {
        serveStatic(app);
        console.log('[Server] Static file serving configured');
      } catch (err) {
        console.error('[Server] Error setting up static files:', err);
      }
    } else {
      console.log('[Server] Setting up Vite dev server');
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // Only start the server if not in a serverless environment (Vercel)
    if (!process.env.VERCEL) {
      const port = parseInt(process.env.PORT || "5000", 10);
      httpServer.listen(
        {
          port,
          host: "0.0.0.0",
          reusePort: true,
        },
        () => {
          log(`serving on port ${port}`);
        },
      );
    } else {
      console.log('[Server] Running in Vercel serverless mode');
    }
  } catch (error) {
    console.error('[Server] Fatal server startup error:', error);
    process.exit(1);
  }
})();

// Export app for both Vercel serverless and direct usage
export default app;

