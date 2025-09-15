import { Request, Response } from "express";
import { uploadBufferToCloudinarySimple } from "../utils/cloudinary";
import { AuthRequest } from "../middlewares/auth.middleware"; 

export const uploadFileController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    // simple validation: type + size (1MB)
    const mimetype = req.file.mimetype;
    const allowed = ["image/jpeg","image/png","image/gif","image/webp"];
    if (!allowed.includes(mimetype)) {
      return res.status(400).json({ success: false, message: "Invalid file type" });
    }
    if (req.file.size > 1 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: "Max file size 1MB" });
    }

    const result = await uploadBufferToCloudinarySimple(req.file.buffer, "uploads");
    return res.status(201).json({
      success: true,
      message: "Upload success",
      data: { url: result.url, publicId: result.publicId }
    });
  } catch (err) {
    console.error("uploadFileController:", err);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};
