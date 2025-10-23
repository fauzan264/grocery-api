import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { addtoCartController, deleteCartController, getCartItemsController, updateCartItemController } from "../controllers/cart.controller";
import { roleVerify } from "../middlewares/role.verify";
import { validateYup } from "../middlewares/validateYup";
import { addToCartSchema, updateCartItemSchema } from "../validations/cart.validation";

const cartRouter = Router ()

cartRouter.post(
  "/items", 
  jwtVerify,
  roleVerify(["CUSTOMER"]),
  validateYup(addToCartSchema),  
  addtoCartController
);

cartRouter.patch(
  "/items",
  jwtVerify, 
  roleVerify(["CUSTOMER"]),
  validateYup(updateCartItemSchema),
  updateCartItemController
);


cartRouter.delete("/items/:itemId", jwtVerify, roleVerify(["CUSTOMER"]), deleteCartController);
cartRouter.get("/items",jwtVerify, roleVerify(["CUSTOMER"]),  getCartItemsController);

export default cartRouter;