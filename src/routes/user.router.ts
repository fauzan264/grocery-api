import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { roleVerify } from "../middlewares/role.verify";
import {
  getMyAddressesByIDController,
  getMyAddressesController,
  getMyProfileController,
  getMyStoreController,
} from "../controllers/user.controller";

//import { file controller }

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
/*router endpoint
userRouter.post("", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller)
userRouter.get("/:id", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller) 
userRouter.get("", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller)
userRouter.put("/:id", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller)
userRouter.delete("/:id", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller)
*/

export default userRouter;
