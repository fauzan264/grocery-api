// src/routes/upload.router.ts
import { Router } from "express";
import { uploadFileController } from "../controllers/upload.controller";
import { jwtVerify } from "../middlewares/jwt.verify";
import { roleVerify } from "../middlewares/role.verify";
import { upload } from "../middlewares/multer.middleware";

const uploadRouter = Router();

uploadRouter.post(
  "/",
  jwtVerify,
  roleVerify(["SUPER_ADMIN", "ADMIN_STORE"]),
  upload.single("file"), // field name: file
  uploadFileController
);

export default uploadRouter;
