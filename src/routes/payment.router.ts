import { Router } from "express";
import { uploaderMulter } from "../middlewares/uploader.multer";
import { jwtVerify } from "../middlewares/jwt.verify";
import { uploadPaymentController } from "../controllers/payment.controller";


const paymentRouter = Router()

paymentRouter.patch("/upload/:orderId", uploaderMulter(['image'], 'memoryStorage').single('paymentProof'),jwtVerify, uploadPaymentController);

export default paymentRouter;
