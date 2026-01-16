import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // Try multiple possible locations for static files
  const possiblePaths = [
    // Standard build output
    path.resolve(__dirname, "..", "public"),
    // Vercel build (dist is root)
    path.resolve(__dirname, "public"),
    // Development
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
  ];
  
  let distPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      console.log(`[Static] Found static files at: ${distPath}`);
      break;
    }
  }
  
  if (!distPath) {
    console.warn(
      `[Static] Warning: Static directory not found. Tried: ${possiblePaths.join(", ")}. ` +
      `API-only mode. Make sure to build the client first with: npm run build`,
    );
    // Don't throw - just log a warning. API can still work.
    return;
  }

  app.use(express.static(distPath, { 
    index: "index.html",
    setHeaders: (res, filepath) => {
      if (filepath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      }
    }
  }));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ message: "Client not built. Static files not found at: " + distPath });
    }
  });
}


