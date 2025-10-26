import { Router } from "express";
import {
  createStockHandler,
  updateStockHandler,
  getStockHandler,
  listStockByStoreHandler,
  transferStockHandler,
  getStocksByProductHandler,
  createStockRequestController,
} from "../controllers/stock.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/authorizeRoles.middleware";
import { jwtVerify } from "../middlewares/jwt.verify";
import { roleVerify } from "../middlewares/role.verify";

const stockRouter = Router();

// Create stock
// -> POST /api/stocks/stores/:storeId
stockRouter.post(
  "/stores/:storeId",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  createStockHandler
);

// alternate: POST /api/stocks (storeId di body)
stockRouter.post(
  "/",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  createStockHandler
);

stockRouter.post(
  "/request",
  jwtVerify,
  roleVerify(["SUPER_ADMIN", "ADMIN_STORE"]),
  createStockRequestController
)

// List by store
// -> GET /api/stocks/stores/:storeId?page=1&limit=20
stockRouter.get(
  "/stores/:storeId",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  listStockByStoreHandler
);

// Get stock by ID
// -> GET /api/stocks/:stockId
stockRouter.get(
  "/:stockId",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE", "CUSTOMER"),
  getStockHandler
);

// Get stocks by product
// -> GET /api/stocks/products/:productId?page=1&limit=20
stockRouter.get(
  "/products/:productId",
  authMiddleware,
  getStocksByProductHandler
);

// Update stock
// -> PATCH /api/stocks/:stockId
stockRouter.patch(
  "/:stockId",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  updateStockHandler
);

// Transfer stock
// -> POST /api/stocks/transfer
stockRouter.post(
  "/transfer",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"),
  transferStockHandler
);

export default stockRouter;
