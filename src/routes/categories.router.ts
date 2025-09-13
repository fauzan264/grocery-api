// src/routes/category.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/authorizeRoles.middleware";
import * as categoryController from "../controllers/category.controller";

const categoryRouter = Router();

/**
 * ======================
 * Public / Store Admin (read only)
 * ======================
 */
categoryRouter.get("/", categoryController.listCategoriesHandler);
categoryRouter.get("/tree", categoryController.getCategoryTreeHandler);
categoryRouter.get("/:id", categoryController.getCategoryHandler);

/**
 * ======================
 * SUPER_ADMIN only (write)
 * ======================
 */
categoryRouter.post(
  "/",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN"),
  categoryController.createCategoryHandler
);

categoryRouter.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN"),
  categoryController.updateCategoryHandler
);

categoryRouter.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN"),
  categoryController.softDeleteCategoryHandler
);

categoryRouter.patch(
  "/:id/restore",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN"),
  categoryController.restoreCategoryHandler
);

/**
 * ======================
 * Logs (SUPER_ADMIN only)
 * ======================
 */
categoryRouter.get(
  "/:id/logs",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN"),
  categoryController.getCategoryLogsHandler
);

export default categoryRouter;
