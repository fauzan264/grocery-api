import { Router } from "express";
import { uploaderMulter } from "../middlewares/uploader.multer";
import { jwtVerify } from "../middlewares/jwt.verify";
<<<<<<< Updated upstream
import { gatewayPaymentController, midtransCallbackController, uploadPaymentController } from "../controllers/payment.controller";
=======
import { gatewayPaymentController, uploadPaymentController } from "../controllers/payment.controller";
>>>>>>> Stashed changes

const paymentRouter = Router()

paymentRouter.patch("/upload/:orderId", uploaderMulter(['image'], 'memoryStorage').single('paymentProof'),jwtVerify, uploadPaymentController);
<<<<<<< Updated upstream
paymentRouter.post("/gateway/:orderId", jwtVerify, gatewayPaymentController)
paymentRouter.post("/midtrans/callback", midtransCallbackController);
=======
paymentRouter.post(":orderId/", jwtVerify, gatewayPaymentController)
>>>>>>> Stashed changes


export default paymentRouter;
