import { Request, Response } from "express";
import { getAllOrdersAdminService } from "../services/adminOrder.service";
import { formatDateJakarta } from "../utils/date";

export const getAllOrdersAdminController = async (req: Request, res: Response) => {
    
  const {userId} = res.locals.payload

  const orders = await getAllOrdersAdminService();

  const mappedOrders = orders.map((order) => ({
    orderId: order.id,
    status: order.status,
    createdAt: formatDateJakarta(order.createdAt),
    totalPrice: order.totalPrice,
    discount: order.discount,
    finalPrice: order.finalPrice,
    paymentProof: order.paymentProof,
    customer: {
      id: order.user.id,
      fullName: order.user.fullName,
      email: order.user.email,
      phoneNumber: order.user.phoneNumber,
      addresses: order.user.UserAddress.map((a) => a.address)
    },
    items: order.OrderItems.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      price: item.price,
      quantity: item.quantity,
      subTotal: item.subTotal
    }))
  }));

  return res.status(200).json({
    message: "All Orders fetched successfully",
    count: mappedOrders.length,
    data: mappedOrders
  });
};
