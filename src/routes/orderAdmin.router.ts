import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { approvePaymentController, cancelOrderAdminController, declinePaymentController, getAllOrdersAdminController, getOrderDetailController } from "../controllers/adminOrder.controller";
import { roleVerify } from "../middlewares/role.verify";

const orderAdminRouter = Router ()

orderAdminRouter.get("/orders", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), getAllOrdersAdminController);
orderAdminRouter.get("/orders/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), getOrderDetailController);
orderAdminRouter.patch("/orders/confirmPayment/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), approvePaymentController);
orderAdminRouter.patch("/orders/declinePayment/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), declinePaymentController);
orderAdminRouter.patch("/orders/cancelOrder/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), cancelOrderAdminController);


export default orderAdminRouter;