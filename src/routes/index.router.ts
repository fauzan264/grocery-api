import { Router } from "express";
import authRouter from "./auth.router";
import userRouter from "./user.router";
import storeRouter from "./store.router";
import cartRouter from "./cart.router";
import * as productController from "../controllers/product.controller";
import * as stockController from "../controllers/stock.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ensureRole, ensureStoreOwnership } from "../middlewares/role.middleware";
import { upload } from "../middlewares/multer.middleware";
import orderRouter from "./order.router";
import { authorizeRoles } from "../middlewares/authorizeRoles.middleware";
import { authorizeStore } from "../middlewares/authorizeStore.middleware";

const mainRouter = Router();

mainRouter.use("/api/auth", authRouter);
mainRouter.use("/api/users", userRouter);
mainRouter.use("/api/stores", storeRouter);
mainRouter.use("/api/cart", cartRouter);;
mainRouter.use("/api/orders", orderRouter)
// Product
mainRouter.get("/products", productController.listProductsHandler);
mainRouter.get("/products/:id", productController.getProductHandler);
mainRouter.patch("/:id", productController.updateProductHandler);
mainRouter.delete("/:id", productController.softDeleteProductHandler);
// SUPER_ADMIN only create
mainRouter.post("/products", authMiddleware, ensureRole("SUPER_ADMIN"), upload.array("images", 5), productController.createProductHandler);
mainRouter.delete("/products/images/:imageId", authMiddleware, ensureRole("SUPER_ADMIN"), productController.deleteProductImageHandler);
// Stock
mainRouter.post("/stores/:storeId/stocks", authMiddleware, ensureStoreOwnership, stockController.createStockHandler);
mainRouter.patch("/stocks/:stockId", authMiddleware, stockController.updateStockHandler);
mainRouter.get("/:id/stocks", productController.getProductStocksHandler);
// Role Check
mainRouter.post(
  "/products",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  productController.createProductHandler
);
// Store Authorization
mainRouter.patch(
  "/products/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  authorizeStore,
  productController.updateProductHandler
);

export default mainRouter;
