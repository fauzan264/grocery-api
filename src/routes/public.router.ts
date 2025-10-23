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
publicRouter.get("/products", getPublicProductsController);
publicRouter.get("/products/:id", getPublicProductByIDController);

export default publicRouter;
