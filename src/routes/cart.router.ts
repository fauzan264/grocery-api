import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { addtoCartController } from "../controllers/cart.controller";

const cartRouter = Router ()

cartRouter.post("/items", jwtVerify, addtoCartController);
cartRouter.post("/items", jwtVerify, addtoCartController);

export default cartRouter;