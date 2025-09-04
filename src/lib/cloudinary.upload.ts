import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryUpload = async (file: Buffer, dir: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: dir },
        (
          error: UploadApiErrorResponse | null | undefined,
          result?: UploadApiResponse
        ) => {
          if (error) {
            return reject(error);
          }
          resolve({ secureUrl: result?.secure_url });
        }
      )
      .end(file);
  });
};
