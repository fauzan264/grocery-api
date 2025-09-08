import { Request, Response } from "express";
import { cancelOrderService, confirmOrderService, createOrderService, getOrderDetailService, getOrdersByUserIdService } from "../services/orders.service";

export const createOrderController = async (req: Request, res: Response) => {
    const { user_id } = res.locals.payload;
    const order = await createOrderService(user_id);

    return res.status(201).json({
        message: "Order created successfully",
        data: order
    })
}

export const cancelOrderController = async (req: Request, res: Response)  => {
  const { userId } = res.locals.payload;
  const {orderId} = req.params

  const cancelledOrder = await cancelOrderService(orderId, userId);

  return res.status(200).json({
    message: "Order cancelled successfully",
    data: cancelledOrder,
  });
  
}

export const confirmOrderController = async (req: Request, res: Response)  => {
  const { userId } = res.locals.payload;
  const {orderId} = req.params

  const confirmOrder = await confirmOrderService(orderId, userId);

  return res.status(200).json({
    message: "Order has been delivered to the costumer",
    data: confirmOrder,
  });
  
}


export const getOrderDetailController = async (req: Request, res: Response) => {
  const {orderId} = req.params;
  const { userId } = res.locals.payload;

  const order = await getOrderDetailService(userId, orderId);

  return res.status(200).json({
    message: "Orders detail fetched successfully",
    data: order, })
}

export const getOrdersByUserController = async (req: Request, res: Response) => {
  const { userId } = res.locals.payload;

  const orders = await getOrdersByUserIdService(userId);

  return res.status(200).json({
    message: "Orders fetched successfully",
    data: orders,
  });
};