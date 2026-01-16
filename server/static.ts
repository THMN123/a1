import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function serveStatic(app: Express) {
  // In production, static files are in dist/public (relative to root)
  // In the built structure, this server file is at dist/index.cjs, so we go up one level
  const distPath = path.resolve(__dirname, "..", "public");
  
  if (!fs.existsSync(distPath)) {
    console.warn(
      `Warning: Static directory not found at ${distPath}. ` +
      `API-only mode. Make sure to build the client first with: npm run build`,
    );
    // Don't throw - just log a warning. API can still work.
    return;
  }

  app.use(express.static(distPath, { 
    index: "index.html",
    setHeaders: (res, path) => {
      if (path.endsWith(".html")) {
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
      res.status(404).json({ message: "Not found. Client not built." });
    }
  });
}

