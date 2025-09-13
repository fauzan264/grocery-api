import { Router } from "express";
import {
createStockHandler,
updateStockHandler,
getStockHandler,
listStockByStoreHandler,
transferStockHandler,
getStocksByProductHandler,
} from "../controllers/stock.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/authorizeRoles.middleware";


const stockRouter = Router();

// Create stock (SUPER_ADMIN can provide storeId in path; ADMIN_STORE will have store enforced)
stockRouter.post("/stores/:storeId/stocks", authMiddleware, authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"), createStockHandler);
stockRouter.post("/stores/stocks", authMiddleware, authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"), createStockHandler); // alternate without param


// List & get
stockRouter.get("/stores/:storeId/stocks", authMiddleware, authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"), listStockByStoreHandler);
stockRouter.get("/stocks/:stockId", authMiddleware, authorizeRoles("SUPER_ADMIN", "ADMIN_STORE", "CUSTOMER"), getStockHandler);

// GET stocks by product
stockRouter.get("/products/:productId/stocks", authMiddleware, getStocksByProductHandler);


// Update stock
stockRouter.patch("/stocks/:stockId", authMiddleware, authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"), updateStockHandler);


// Transfer
stockRouter.post("/stocks/transfer", authMiddleware, authorizeRoles("SUPER_ADMIN", "ADMIN_STORE"), transferStockHandler);


export default stockRouter;