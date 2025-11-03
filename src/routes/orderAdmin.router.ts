import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { approvePaymentController, cancelOrderAdminController, declinePaymentController, getAllOrdersAdminController, getOrderDetailController, getOrderStatusLogController, sendOrderContoller } from "../controllers/adminOrder.controller";
import { roleVerify } from "../middlewares/role.verify";

const orderAdminRouter = Router ()

orderAdminRouter.get("/orders", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), getAllOrdersAdminController);
orderAdminRouter.get("/orders/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), getOrderDetailController);
orderAdminRouter.get("/orders/:orderId/statusLog", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), getOrderStatusLogController);
orderAdminRouter.patch("/orders/confirmPayment/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), approvePaymentController);
orderAdminRouter.patch("/orders/declinePayment/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), declinePaymentController);
orderAdminRouter.patch("/orders/cancelOrder/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), cancelOrderAdminController);
orderAdminRouter.patch("/orders/sent/:orderId", jwtVerify, roleVerify(["SUPER_ADMIN","ADMIN_STORE" ]), sendOrderContoller)



export default orderAdminRouter;