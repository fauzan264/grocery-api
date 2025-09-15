import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { addtoCartController, deleteCartController, getCartItemsController, updateCartItemController } from "../controllers/cart.controller";
import { roleVerify } from "../middlewares/role.verify";

const cartRouter = Router ()

cartRouter.post("/items", jwtVerify,roleVerify(["CUSTOMER"]),  addtoCartController);
cartRouter.patch("/items",jwtVerify, roleVerify(["CUSTOMER"]),  updateCartItemController);
cartRouter.patch("/items", (req, res, next) => {
  console.log("PATCH /api/cart/items HIT");
  next();
}, jwtVerify, roleVerify(["CUSTOMER"]), updateCartItemController);

cartRouter.delete("/items/:itemId", jwtVerify, roleVerify(["CUSTOMER"]), deleteCartController);
cartRouter.get("/items",jwtVerify, roleVerify(["CUSTOMER"]),  getCartItemsController);

export default cartRouter;