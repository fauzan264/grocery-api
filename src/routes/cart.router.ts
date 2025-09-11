import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { addtoCartController, deleteCartController, getCartItemsController, updateCartItemController } from "../controllers/cart.controller";
import { ensureRole } from "../middlewares/authorizeRoles.middleware";
import { roleVerify } from "../middlewares/role.verify";

const cartRouter = Router ()

cartRouter.post("/items", jwtVerify,roleVerify(["CUSTOMER"]),  addtoCartController);
cartRouter.patch("/items/:itemId", jwtVerify, roleVerify(["CUSTOMER"]),  updateCartItemController);
cartRouter.delete("/items/:itemId", jwtVerify, roleVerify(["CUSTOMER"]), deleteCartController);
cartRouter.get("/items",jwtVerify, roleVerify(["CUSTOMER"]),  getCartItemsController);

export default cartRouter;