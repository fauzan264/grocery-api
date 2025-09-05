import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { addtoCartController, updateCartItemController } from "../controllers/cart.controller";

const cartRouter = Router ()

cartRouter.post("/items", jwtVerify, addtoCartController);
cartRouter.post("/items/:itemId", jwtVerify, updateCartItemController);

export default cartRouter;