import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { approvePaymentController, getAllOrdersAdminController, getOrderDetailController } from "../controllers/adminOrder.controller";
import { ensureRole, ensureStoreOwnership } from "../middlewares/role.middleware";
import { roleVerify } from "../middlewares/role.verify";

const orderAdminRouter = Router ()

orderAdminRouter.get("/orders", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), getAllOrdersAdminController);
orderAdminRouter.get("/orders/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), getOrderDetailController);
orderAdminRouter.patch("/orders/confirmPayment/:orderId", jwtVerify, roleVerify(["ADMIN_STORE" ]), approvePaymentController)


export default orderAdminRouter;