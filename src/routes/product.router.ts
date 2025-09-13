import { Router } from "express";
import * as productController from "../controllers/product.controller";
import * as stockController from "../controllers/stock.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ensureRole, ensureStoreOwnership } from "../middlewares/authorizeRoles.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authorizeRoles } from "../middlewares/authorizeRoles.middleware";
import { authorizeStore } from "../middlewares/authorizeStore.middleware";

const productRouter = Router();

// ==================== Product ====================
productRouter.get("/", productController.listProductsHandler);
productRouter.get("/:id", productController.getProductHandler);

productRouter.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN"),
  productController.updateProductHandler
);

productRouter.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN"),
  productController.softDeleteProductHandler
);

// ==================== SUPER_ADMIN only create Products ====================
productRouter.post(
  "/",
  authMiddleware,
  ensureRole("SUPER_ADMIN"),
  upload.array("images", 5),
  productController.createProductHandler
);

productRouter.delete(
  "/images/:imageId",
  authMiddleware,
  ensureRole("SUPER_ADMIN"),
  productController.deleteProductImageHandler
);

// ==================== Role Check ====================
productRouter.post(
  "/",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  productController.createProductHandler
);

// ==================== Store Authorization ====================
productRouter.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  authorizeStore,
  productController.updateProductHandler
);

export default productRouter;
