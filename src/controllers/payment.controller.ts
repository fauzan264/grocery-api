import { Request, Response } from "express";
import { createOrderService } from "../services/orders.service";
import { gatewayPaymentService, handleMidtransCallback, uploadPaymentService } from "../services/payment.service";



export const gatewayPaymentController = async (req: Request, res: Response) => {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const transaction = await gatewayPaymentService(orderId);

    return res.status(200).json({
      success: true,
      data: transaction, 
    })};

export const midtransCallbackController = async (req: Request, res: Response) => {
    const result = await handleMidtransCallback(req.body);
    return res.status(200).json(result);
};

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
  
  const mappedResult = {
    orderId: result.id,
    paymentMethod: result.paymentMethod,
    paymentProof: result.paymentProof,
    status: result.status,
    createdAt: result.createdAt,
  };

  res.status(201).json({
    success: true,
    message: "Payment receipt successfully uploaded",
    order : mappedResult
  });
};