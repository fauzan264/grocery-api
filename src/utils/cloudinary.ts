import { v2 as cloudinary } from "cloudinary";


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


import streamifier from "streamifier";


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


export function destroyFromCloudinary(publicId: string): Promise<{ result: string }> {
return new Promise((resolve, reject) => {
cloudinary.uploader.destroy(publicId, (err, result) => {
if (err) return reject(err);
resolve(result as { result: string });
});
});
}