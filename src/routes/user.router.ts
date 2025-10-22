import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { roleVerify } from "../middlewares/role.verify";
import {
  getMyAddressesByIDController,
  getMyAddressesController,
  getMyProfileController,
  getMyStoreController,
  //admin controller
  createUserAdminController,
  listUsersAdminController,
  getUserAdminByIdController,
  updateUserAdminController,
  deleteUserAdminController,
  createAddressesController,
  updateAddressesController,
  deleteAddressesController,
  updateMyProfileController,
} from "../controllers/user.controller";
import { validateYup } from "../middlewares/validateYup";
import {
  createUserAdminSchema,
  updateUserAdminSchema,
} from "../validations/user.admin.validation";
import { uploaderMulter } from "../middlewares/uploader.multer";
import {
  createAddressesSchema,
  updateAddressesSchema,
  updateMyProfileSchema,
} from "../validations/user.validation";

const userRouter = Router();

userRouter.get("/me", jwtVerify, getMyProfileController);
userRouter.put(
  "/me",
  jwtVerify,
  uploaderMulter(["image"], "memoryStorage").single("photo_profile"),
  validateYup(updateMyProfileSchema),
  updateMyProfileController
);
userRouter.get("/:userId/addresses", jwtVerify, getMyAddressesController);
userRouter.get(
  "/:userId/addresses/:addressId",
  jwtVerify,
  getMyAddressesByIDController
);
userRouter.get(
  "/me/store",
  jwtVerify,
  roleVerify(["ADMIN_STORE"]),
  getMyStoreController
);

//end point super admin
userRouter.post(
  "/",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  validateYup(createUserAdminSchema),
  createUserAdminController
);

userRouter.get(
  "/",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  listUsersAdminController
);

userRouter.get(
  "/:id",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  getUserAdminByIdController
);

userRouter.put(
  "/:id",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  validateYup(updateUserAdminSchema),
  updateUserAdminController
);

userRouter.delete(
  "/:id",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  deleteUserAdminController
);
userRouter.post(
  "/:user_id/addresses",
  jwtVerify,
  validateYup(createAddressesSchema),
  createAddressesController
);
userRouter.put(
  "/:userId/addresses/:addressId",
  jwtVerify,
  validateYup(updateAddressesSchema),
  updateAddressesController
);
userRouter.delete(
  "/:userId/addresses/:addressId",
  jwtVerify,
  deleteAddressesController
);

export default userRouter;
