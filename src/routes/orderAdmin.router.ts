import { Router } from "express";
import { jwtVerify } from "../middlewares/jwt.verify";
import { getAllOrdersAdminController } from "../controllers/adminOrder.controller";
import { ensureRole, ensureStoreOwnership } from "../middlewares/role.middleware";
import { roleVerify } from "../middlewares/role.verify";

const orderAdminRouter = Router ()

orderAdminRouter.get("/orders", jwtVerify, roleVerify(["SUPER_ADMIN"]), getAllOrdersAdminController);

export default orderAdminRouter;