import { supabase } from "./supabase-client";
import { Response } from "express";
import { randomUUID } from "crypto";

export class SupabaseStorageService {
  private bucketName = "app-storage"; // Default bucket name

  /**
   * Initialize storage buckets if they don't exist
   */
  async initializeBuckets() {
    try {
      // Create public bucket
      await supabase.storage.createBucket(this.bucketName, {
        public: true,
      });
      console.log(`Bucket '${this.bucketName}' created`);
    } catch (error: any) {
      // Bucket might already exist, that's okay
      if (!error?.message?.includes("already exists")) {
        console.error("Error creating bucket:", error);
      }
    }
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    filePath: string,
    fileData: Buffer | Blob,
    contentType: string = "application/octet-stream"
  ) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileData, {
          contentType,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(this.bucketName).getPublicUrl(filePath);

      return {
        path: filePath,
        url: publicUrl,
        size: fileData instanceof Buffer ? fileData.length : await (fileData as Blob).size,
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  /**
   * Download a file from Supabase Storage
   */
  async downloadFile(filePath: string) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(filePath: string): string {
    const {
      data: { publicUrl },
    } = supabase.storage.from(this.bucketName).getPublicUrl(filePath);

    return publicUrl;
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string) {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath: string = "") {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(dirPath);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("List error:", error);
      throw error;
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      console.error("Signed URL error:", error);
      throw error;
    }
  }

  /**
   * Stream download to response
   */
  async streamDownload(
    filePath: string,
    res: Response,
    cacheTtlSec: number = 3600
  ) {
    try {
      const buffer = await this.downloadFile(filePath);

      res.set({
        "Content-Type": "application/octet-stream",
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
        "Content-Disposition": `attachment; filename="${filePath.split('/').pop()}"`,
      });

      res.send(buffer);
    } catch (error) {
      console.error("Stream download error:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  }
}

export const storageService = new SupabaseStorageService();

export default storageService;
