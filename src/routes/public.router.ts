import { Router } from "express";
import {
  getPublicProductByIDController,
  getPublicProductsController,
  getPublicStoreByIdController,
  getPublicStoreNearbyController,
} from "../controllers/public.controller";

const publicRouter = Router();

publicRouter.get("/stores/nearby", getPublicStoreNearbyController);
publicRouter.get("/stores/:id", getPublicStoreByIdController);
publicRouter.get("/stores/:store_id/product/:product_id", getPublicProductByIDController);
publicRouter.get("/products", getPublicProductsController);

export default publicRouter;
