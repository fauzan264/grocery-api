import { Request, Response } from "express";
import { createGopayTransaction, uploadPaymentService } from "../services/payment.service";


export const uploadPaymentController = async (req: Request, res: Response) => {

    const {userId} = res.locals.payload
    const { orderId } = req.params;
    const imageFile = req.file;

    if (!imageFile) {
        return res.status(400).json({
            success: false,
            message: "No image uploaded.",
        });
    }

  const result = await uploadPaymentService({ orderId, imageFile, userId });
  console.log(imageFile)

  res.status(201).json({
    success: true,
    message: "Payment receipt successfully uploaded",
    order : result
  });
};