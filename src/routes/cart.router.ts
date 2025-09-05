import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { addtoCartController, deleteCartController, getCartItemsController, updateCartItemController } from "../controllers/cart.controller";

const cartRouter = Router ()

cartRouter.post("/items", jwtVerify,  addtoCartController);
cartRouter.patch("/items/:itemId", jwtVerify,  updateCartItemController);
cartRouter.delete("/items/:itemId", jwtVerify, deleteCartController);
cartRouter.get("/items",jwtVerify,  getCartItemsController);

export default cartRouter;