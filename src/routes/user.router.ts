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
} from "../controllers/user.controller";
import { validateYup } from "../middlewares/validateYup";
import { createUserAdminSchema, updateUserAdminSchema } from "../validations/user.admin.validation";


const userRouter = Router();

userRouter.get("/me", jwtVerify, getMyProfileController);
userRouter.get("/me/addresses", jwtVerify, getMyAddressesController);
userRouter.get(
  "/me/addresses/:addressId",
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

userRouter.get("/", jwtVerify, roleVerify(["SUPER_ADMIN"]), listUsersAdminController);

userRouter.get("/:id", jwtVerify, roleVerify(["SUPER_ADMIN"]), getUserAdminByIdController);

userRouter.put(
  "/:id",
  jwtVerify,
  roleVerify(["SUPER_ADMIN"]),
  validateYup(updateUserAdminSchema),
  updateUserAdminController
);

userRouter.delete("/:id", jwtVerify, roleVerify(["SUPER_ADMIN"]), deleteUserAdminController);

export default userRouter;
