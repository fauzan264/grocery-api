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
import paymentRouter from "./payment.router";
import orderAdminRouter from "./orderAdmin.router";



const mainRouter = Router();

mainRouter.use("/api/auth", authRouter);
mainRouter.use("/api/users", userRouter);
mainRouter.use("/api/stores", storeRouter);

//Order
mainRouter.use("/api/cart", cartRouter);
mainRouter.use("/api/orders", orderRouter);
mainRouter.use("/api/payment",paymentRouter);

//Order (Admin)
mainRouter.use("/api/admin", orderAdminRouter);

// Product
mainRouter.get("/api/products", productController.listProductsHandler);
mainRouter.get("/api/products/:id", productController.getProductHandler);
mainRouter.patch("/api/:id", authMiddleware, authorizeRoles("SUPER_ADMIN"), productController.updateProductHandler);
mainRouter.delete("/api/:id", authMiddleware, authorizeRoles("SUPER_ADMIN"), productController.softDeleteProductHandler);

// SUPER_ADMIN only create Products
mainRouter.post("/api/products", authMiddleware, ensureRole("SUPER_ADMIN"), upload.array("images", 5), productController.createProductHandler);
mainRouter.delete("/api/products/images/:imageId", authMiddleware, ensureRole("SUPER_ADMIN"), productController.deleteProductImageHandler);
// Stock
mainRouter.post("/api/stores/:storeId/stocks", authMiddleware, ensureStoreOwnership, stockController.createStockHandler);
mainRouter.patch("/api/stocks/:stockId", authMiddleware, stockController.updateStockHandler);
mainRouter.get("/api/:id/stocks", productController.getProductStocksHandler);
// Role Check
mainRouter.post(
  "/api/products",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  productController.createProductHandler
);
// Store Authorization
mainRouter.patch(
  "/api/products/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  authorizeStore,
  productController.updateProductHandler
);

export default mainRouter;
