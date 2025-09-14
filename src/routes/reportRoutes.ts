import { Router } from "express";
import { getSalesReportHandler } from "../controllers/report.controller";
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

export default reportRouter;