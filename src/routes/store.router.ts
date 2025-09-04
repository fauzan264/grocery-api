import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { roleVerify } from "../middlewares/role.verify";
import {
  createStoreController,
  deleteStoreController,
  getAllStoreController,
  getStoreByIdController,
  updateStoreController,
} from "../controllers/store.controller";
import { uploaderMulter } from "../middlewares/uploader.multer";

const storeRouter = Router();

storeRouter.get(
  "/",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  getAllStoreController
);
storeRouter.get(
  "/:id",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  getStoreByIdController
);
storeRouter.post(
  "/",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  uploaderMulter(["image"], "memoryStorage").single("logo"),
  createStoreController
);
storeRouter.delete(
  "/:id",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  deleteStoreController
);
storeRouter.put(
  "/:id",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  uploaderMulter(["image"], "memoryStorage").single("logo"),
  updateStoreController
);

export default storeRouter;
