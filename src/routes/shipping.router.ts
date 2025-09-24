import { Router } from "express";
import {
  citiesShippingController,
  districtsShippingController,
  provincesByIdShippingController,
  provincesShippingController,
} from "../controllers/shipping.controller";

const shippingRouter = Router();

shippingRouter.get("/provinces", provincesShippingController);
shippingRouter.get("/provinces/:id", provincesByIdShippingController);
shippingRouter.get("/cities/:provinceId", citiesShippingController);
shippingRouter.get("/districts/:cityId", districtsShippingController);

// shippingRouter.get("/subdistrics", subdistricsShippingController);
// shippingRouter.get("/subdistrics/:id", subdistricsByIdShippingController);

export default shippingRouter;
