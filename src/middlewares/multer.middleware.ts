import multer from "multer";
import { Request } from "express";


const storage = multer.memoryStorage();


const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
if (allowed.includes(file.mimetype)) cb(null, true);
else cb(new Error("Invalid file type"));
};


export const upload = multer({
storage,
limits: { fileSize: 1 * 1024 * 1024 },
fileFilter,
});