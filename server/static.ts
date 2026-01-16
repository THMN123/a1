import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  console.log(`\n[Static] ==================== STATIC FILE SETUP ====================`);
  console.log(`[Static] Current __dirname: ${__dirname}`);
  console.log(`[Static] Current process.cwd(): ${process.cwd()}`);
  console.log(`[Static] Node env: ${process.env.NODE_ENV}`);
  console.log(`[Static] Vercel: ${process.env.VERCEL ? 'yes' : 'no'}`);
  console.log(`[Static] ================================================================\n`);
  
  // On Vercel, __dirname is /var/task/dist and we need to go up to find public
  // In dev, __dirname is /server and we need to go up to find dist/public
  // After build, dist is the root directory on Vercel
  
  const possiblePaths = [
    // Standard build output after local build
    path.join(__dirname, "..", "public"),
    // When __dirname is dist (Vercel root)
    path.join(__dirname, "public"),
    // Relative to cwd
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "dist", "public"),
    // Vercel specific
    "/var/task/public",
    "/var/task/dist/public",
  ];
  
  console.log(`[Static] Checking paths:`, possiblePaths);
  
  let distPath = "";
  for (const p of possiblePaths) {
    const resolvedPath = path.resolve(p);
    const exists = fs.existsSync(resolvedPath);
    console.log(`[Static] ${resolvedPath} - exists: ${exists}`);
    
    if (exists) {
      // Check if index.html exists in this directory
      const indexExists = fs.existsSync(path.join(resolvedPath, "index.html"));
      console.log(`[Static]   └─ index.html exists: ${indexExists}`);
      
      if (indexExists) {
        distPath = resolvedPath;
        console.log(`[Static] ✓✓✓ USING: ${distPath}\n`);
        break;
      }
    }
  }
  
  if (!distPath) {
    console.error(
      `[Static] ✗✗✗ CRITICAL: No valid static directory found with index.html`,
    );
    // Return without setting up static, API will still work
    return;
  }

  // Serve static files
  console.log(`[Static] Setting up express.static middleware for: ${distPath}`);
  app.use(express.static(distPath, { 
    index: "index.html",
    maxAge: "1h",
    setHeaders: (res, filepath) => {
      res.setHeader("Cache-Control", "public, max-age=3600");
      if (filepath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      } else if (filepath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      } else if (filepath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      }
    }
  }));

  // SPA catch-all - serve index.html for any route that doesn't match a file
  app.use("*", (req, res) => {
    const indexPath = path.join(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      console.log(`[Static] SPA fallback for ${req.path} → serving index.html`);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(indexPath);
    } else {
      console.error(`[Static] CRITICAL: index.html not found at ${indexPath}`);
      res.status(404).json({ 
        error: "index.html not found", 
        looked_in: indexPath,
        dist_path: distPath
      });
    }
  });
}


