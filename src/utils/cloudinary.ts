import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * uploadBufferToCloudinary
 * - existing function you already had (ke-keep, returns Cloudinary raw shape)
 * - uses streamifier to pipe buffer into cloudinary uploader stream
 */
export function uploadBufferToCloudinary(buffer: Buffer, folder = "products"): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Empty result from Cloudinary"));
      resolve({
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      });
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/**
 * destroyFromCloudinary
 * - existing destroy wrapper you had (ke-keep)
 * - returns the raw object like { result: "ok" | "not found" } (as promise)
 */
export function destroyFromCloudinary(publicId: string): Promise<{ result: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (err, result) => {
      if (err) return reject(err);
      resolve(result as { result: string });
    });
  });
}

/* ---------------------------
   Adapter helpers for services
   --------------------------- */

/**
 * uploadBufferToCloudinarySimple
 * - adapter that returns shape compatible with product.service:
 *   { url: string; publicId: string; width?, height?, format? }
 * - internally calls uploadBufferToCloudinary (which returns secure_url/public_id)
 */
export async function uploadBufferToCloudinarySimple(
  buffer: Buffer,
  folder = "products"
): Promise<{ url: string; publicId: string; width?: number; height?: number; format?: string }> {
  const res = await uploadBufferToCloudinary(buffer, folder);
  return {
    url: res.secure_url,
    publicId: res.public_id,
    width: res.width,
    height: res.height,
    format: res.format,
  };
}

/**
 * destroyPublicId
 * - adapter that returns boolean: true when destroyed or not found; false if failed
 * - wraps destroyFromCloudinary
 */
export async function destroyPublicId(publicId: string): Promise<boolean> {
  try {
    const r = await destroyFromCloudinary(publicId);
    // treat 'ok' and 'not found' as success
    return r && (r.result === "ok" || r.result === "not found");
  } catch (err) {
    return false;
  }
}
