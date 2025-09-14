import { Router } from "express";
import {
  getSalesReportHandler,
  getStockReportHandler,
  getDiscountReportHandler,
  getCustomerBehaviorReportHandler,
} from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/authorizeRoles.middleware";

const reportRouter = Router();

// Sales Report
reportRouter.get(
  "/sales",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  getSalesReportHandler
);

// Stock Report
reportRouter.get(
  "/stock",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  getStockReportHandler
);

// Discount Report
reportRouter.get(
  "/discount",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  getDiscountReportHandler
);

// Customer Behavior Report
reportRouter.get(
  "/customer-behavior",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  getCustomerBehaviorReportHandler
);

export default reportRouter;
