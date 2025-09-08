import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { cancelOrderController, confirmOrderController, createOrderController, getOrderDetailController, getOrdersByUserController } from "../controllers/order.controller";
import { ensureRole } from "../middlewares/role.middleware";
import { roleVerify } from "../middlewares/role.verify";

const orderRouter = Router ()

orderRouter.post("/checkout", jwtVerify,roleVerify(["CUSTOMER"]),createOrderController);
orderRouter.get("/me", jwtVerify,roleVerify(["CUSTOMER"]),getOrdersByUserController)
orderRouter.patch("/:orderId/cancel",jwtVerify,roleVerify(["CUSTOMER"]),cancelOrderController)
orderRouter.patch("/:orderId/confirm",jwtVerify,roleVerify(["CUSTOMER"]),confirmOrderController)
orderRouter.get("/:orderId/detail",jwtVerify,roleVerify(["CUSTOMER"]),getOrderDetailController)

export default orderRouter;