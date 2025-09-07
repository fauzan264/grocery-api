import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { cancelOrderController, createOrderController, getOrdersByUserController } from "../controllers/order.controller";

const orderRouter = Router ()

orderRouter.post("/checkout", jwtVerify,  createOrderController);
orderRouter.get("/me", jwtVerify, getOrdersByUserController)
orderRouter.patch("/:orderId/cancel",jwtVerify, cancelOrderController)

export default orderRouter;