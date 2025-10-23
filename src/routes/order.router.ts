import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { cancelOrderController, confirmOrderController, createOrderController, getOrderDetailController, getOrdersByUserController } from "../controllers/order.controller";
import { roleVerify } from "../middlewares/role.verify";
import { validateYup } from "../middlewares/validateYup";
import { createOrderSchema } from "../validations/order.validation";

const orderRouter = Router ()

orderRouter.post(
    "/checkout", 
    jwtVerify,
    roleVerify(["CUSTOMER"]),
    validateYup(createOrderSchema),
    createOrderController);
orderRouter.get("/me", jwtVerify,roleVerify(["CUSTOMER"]),getOrdersByUserController)
orderRouter.patch("/:orderId/cancel",jwtVerify,roleVerify(["CUSTOMER"]),cancelOrderController)
orderRouter.patch("/:orderId/confirm",jwtVerify,roleVerify(["CUSTOMER"]),confirmOrderController)
orderRouter.get("/:orderId/detail",jwtVerify,roleVerify(["CUSTOMER"]),getOrderDetailController)

export default orderRouter;