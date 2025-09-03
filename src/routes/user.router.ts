import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { roleVerify } from "../middlewares/role.verify";


//import { file controller }


const userRouter = Router();

/*router endpoint
userRouter.post("", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller)
userRouter.get("/:id", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller) 
userRouter.get("", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller)
userRouter.put("/:id", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller)
userRouter.delete("/:id", jwtVerify, roleVerify(["SUPER_ADMIN"]), file controller)

*/
export default userRouter