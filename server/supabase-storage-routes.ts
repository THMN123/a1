import type { Express } from "express";
import { storageService } from "./supabase-storage";
import multer from "multer";
import { randomUUID } from "crypto";

// Setup multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

export function registerStorageRoutes(app: Express): void {
  // Initialize buckets
  storageService.initializeBuckets().catch(console.error);

  // Upload file
  app.post("/api/storage/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = req.user as any;
      const fileId = randomUUID();
      const fileName = req.file.originalname;
      const filePath = `uploads/${user.id}/${fileId}-${fileName}`;

      const result = await storageService.uploadFile(
        filePath,
        req.file.buffer,
        req.file.mimetype
      );

      res.json(result);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  });

  // Download file
  app.get("/api/storage/download/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      
      // Construct the file path (you may need to adjust based on your URL scheme)
      const filePath = `uploads/${fileId}`;

      await storageService.streamDownload(filePath, res);
    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ message: error.message || "Download failed" });
    }
  });

  // Get public URL
  app.post("/api/storage/public-url", (req, res) => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({ message: "Missing filePath" });
      }

      const url = storageService.getPublicUrl(filePath);
      res.json({ url });
    } catch (error: any) {
      console.error("Public URL error:", error);
      res.status(500).json({ message: error.message || "Failed to get URL" });
    }
  });

  // Delete file
  app.delete("/api/storage/:fileId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { fileId } = req.params;
      const filePath = `uploads/${fileId}`;

      await storageService.deleteFile(filePath);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete error:", error);
      res.status(500).json({ message: error.message || "Delete failed" });
    }
  });

  // Get signed URL for temporary access
  app.post("/api/storage/signed-url", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { filePath, expiresIn = 3600 } = req.body;

      if (!filePath) {
        return res.status(400).json({ message: "Missing filePath" });
      }

      const url = await storageService.getSignedUrl(filePath, expiresIn);
      res.json({ url });
    } catch (error: any) {
      console.error("Signed URL error:", error);
      res.status(500).json({ message: error.message || "Failed to get signed URL" });
    }
  });
}

export default registerStorageRoutes;
