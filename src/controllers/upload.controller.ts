import { Response } from "express";
import { uploadBufferToCloudinarySimple } from "../utils/cloudinary";
import { AuthRequest } from "../middlewares/auth.middleware"; 
import { prisma } from "../db/connection";


export const uploadFileController = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Files are required" });
    }

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const productId = req.body.productId as string | undefined;

    const results = [];

    // cek apakah produk ada
    if (productId) {
      const productExists = await prisma.product.findUnique({ where: { id: productId } });
      if (!productExists) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
    }

    for (const file of files) {
      if (!allowed.includes(file.mimetype)) {
        return res.status(400).json({ success: false, message: `Invalid file type: ${file.originalname}` });
      }
      if (file.size > 1 * 1024 * 1024) {
        return res.status(413).json({ success: false, message: `${file.originalname} exceeds max 1MB` });
      }

      const result = await uploadBufferToCloudinarySimple(file.buffer, "uploads");

      let savedImage = null;
      if (productId) {
        // cek apakah produk sudah punya primary image
        const alreadyHasPrimary = await prisma.productImage.findFirst({
          where: { productId, isPrimary: true },
        });

        savedImage = await prisma.productImage.create({
          data: {
            productId,
            url: result.url,
            publicId: result.publicId,
            altText: file.originalname,
            isPrimary: alreadyHasPrimary ? false : true, // jadikan primary kalau belum ada
          },
        });
      }

      results.push(savedImage ?? { url: result.url, publicId: result.publicId });
    }

    return res.status(201).json({
      success: true,
      message: "Upload success",
      data: results,
    });
  } catch (err) {
    console.error("uploadFileController:", err);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};
