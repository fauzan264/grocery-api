import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { createOrderController, getOrdersByUserController } from "../controllers/order.controller";


const orderRouter = Router ()

orderRouter.post("/checkout", jwtVerify,  createOrderController);
orderRouter.get("/:userId", jwtVerify, getOrdersByUserController)

export default orderRouter;