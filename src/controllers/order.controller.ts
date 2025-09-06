import { Request, Response } from "express";
import { createOrderService, getOrdersByUserIdService } from "../services/orders.service";

export const createOrderController = async (req: Request, res: Response) => {
    console.log("Payload:", res.locals.payload);
    const { user_id } = res.locals.payload;
    const order = await createOrderService(user_id);

    return res.status(201).json({
        message: "Order created successfully",
        data: order
    })
}

export const getOrdersByUserController = async (req: Request, res: Response) => {
  const { userId } = res.locals.payload;

  const orders = await getOrdersByUserIdService(userId);

  return res.status(200).json({
    message: "Orders fetched successfully",
    data: orders,
  });
};