import { Request, Response, NextFunction } from "express";
import multer from "multer";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("GlobalError:", err);

  // Multer file size error
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ success: false, message: "File too large. Max 1MB" });
    }
    return res.status(400).json({ success: false, message: err.message || "Upload error" });
  }

  // custom invalid file type
  if (err?.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({ success: false, message: "Invalid file type (allowed: jpeg/png/webp/gif)" });
  }

  // default
  const status = err?.status || 500;
  return res.status(status).json({ success: false, message: err?.message || "Internal Server Error" });
}
