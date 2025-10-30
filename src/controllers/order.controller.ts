import { Request, Response } from "express";
import {
  cancelOrderService,
  confirmOrderService,
  createOrderService,
  getOrderDetailService,
  getOrdersByUserIdService,
} from "../services/orders.service";

export const createOrderController = async (req: Request, res: Response) => {
  const { user_id } = res.locals.payload;
  const { storeId, couponCodes, paymentMethod, shipment } = req.body;

  console.log("Full req.body:", req.body);
console.log("Shipment type:", typeof shipment);
console.log("Shipment keys:", Object.keys(shipment));


  const orderResult = await createOrderService(
    user_id,
    storeId,
    couponCodes,
    paymentMethod,
    shipment
  );

  if (!orderResult) {
    return res.status(400).json({
      message: "Failed to create order",
    });
  }

  const { order, userAddress, user, shipment: orderShipment } = orderResult;

  const result = {
    id: order.id,
    storeId: storeId,
    status: order.status,
    sub_total: order.totalPrice,
    discount: order.discountTotal,
    finalPrice: order.finalPrice,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    expireAt: order.expiredAt,
    shipment: orderShipment,
    user: {
      receiverName: user.fullName,
      receiverNumber: user.phoneNumber,
      shippingAddress: userAddress.address,
    },
  };

  return res.status(201).json({
    message: "Order created successfully",
    data: result,
  });
};

export const cancelOrderController = async (req: Request, res: Response) => {
  const { userId } = res.locals.payload;
  const { orderId } = req.params;

  const order = await cancelOrderService(orderId);

  const cancelledOrder = {
    id: order.id,
    storeId: order.storeId,
    status: order.status,
    sub_total: order.totalPrice,
    discount: order.discountTotal,
    finalPrice: order.finalPrice,
    createdAt: order.createdAt,
  };

  return res.status(200).json({
    message: "Order cancelled successfully",
    data: cancelledOrder,
  });
};

export const confirmOrderController = async (req: Request, res: Response) => {
  const { userId } = res.locals.payload;
  const { orderId } = req.params;

  const order = await confirmOrderService(orderId);

  const confirmOrder = {
    id: order.id,
    storeId: order.storeId,
    status: order.status,
    sub_total: order.totalPrice,
    discount: order.discountTotal,
    finalPrice: order.finalPrice,
    updatedAt: order.updatedAt,
  };

  return res.status(200).json({
    message: "Order has been delivered to the costumer",
    data: confirmOrder,
  });
};

export const getOrderDetailController = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { userId } = res.locals.payload;

  const order = await getOrderDetailService(userId, orderId);

  const orderDetail = {
    id: order?.id,
    paymentMethod: order?.paymentMethod,
    status: order?.status,
    sub_total: order?.totalPrice,
    discount: order?.discountTotal,
    finalPrice: order?.finalPrice,
    createdAt: order?.createdAt,
    expiredAt: order?.expiredAt,
    items: order?.OrderItems.map((item) => ({
      quantity: item.quantity,
      price: item.price,
      subTotal: item.subTotal,
      product: {
        name: item.product.name,
        imageUrl: item.product.images?.[0]?.url || null,
      },
    })),
    user: {
      receiverName: order?.user.fullName,
      receiverPhone: order?.user.phoneNumber,
      receiverAdress: order?.user.UserAddress,
    },
     shipment: {
      courier: order?.Shipment?.courier,
      service: order?.Shipment?.service,
      shippingCost: order?.Shipment?.shippingCost,
      shippingDays: order?.Shipment?.shippingDays,
      address: order?.Shipment?.address,
      provinceName: order?.Shipment?.provinceName,
      cityName: order?.Shipment?.cityName,
      districtName: order?.Shipment?.districtName,
    },
    totalItems: order?.OrderItems.reduce((acc, item) => acc + item.quantity, 0),
  };

  return res.status(200).json({
    message: "Orders detail fetched successfully",
    data: orderDetail,
  });
};

export const getOrdersByUserController = async (
  req: Request,
  res: Response
) => {
  const { userId } = res.locals.payload;
  const { orderId, startDate, endDate, page = "1", limit = "10" } = req.query;

  const { orders, total } = await getOrdersByUserIdService(
    userId,
    {
      orderId: orderId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    },
    { page: parseInt(page as string), limit: parseInt(limit as string) }
  );

  const orderList = orders.map((order) => ({
    id: order.id,
    storeId: order.storeId,
    status: order.status,
    sub_total: order.totalPrice,
    discount: order.discountTotal,
    finalPrice: order.finalPrice,
    createdAt: order.createdAt,
    items: order?.OrderItems.map((item) => ({
      quantity: item.quantity,
      price: item.price,
      subTotal: item.subTotal,
      product: {
        name: item.product.name,
        imageUrl: item.product.images?.[0]?.url || null,
      },
    })),
    totalItems: order?.OrderItems.reduce((acc, item) => acc + item.quantity, 0),
  }));

  return res.status(200).json({
    message: "Orders fetched successfully",
    data: orderList,
    meta: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};
