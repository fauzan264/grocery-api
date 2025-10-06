import { Router } from "express";
import {
  getPublicStoreByIdController,
  getPublicStoreNearbyController,
} from "../controllers/public.controller";

const publicRouter = Router();

publicRouter.get("/stores/nearby", getPublicStoreNearbyController);
publicRouter.get("/stores/:id", getPublicStoreByIdController);

export default publicRouter;
