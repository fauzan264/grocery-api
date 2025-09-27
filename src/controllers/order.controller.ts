import { Request, Response } from "express";
import { cancelOrderService, confirmOrderService, createOrderService, getOrderDetailService, getOrdersByUserIdService } from "../services/orders.service";


export const createOrderController = async (req: Request, res: Response) => {
  const { user_id } = res.locals.payload;
  const { storeId, couponCodes, paymentMethod } = req.body;

  const orderResult = await createOrderService(user_id, storeId, couponCodes, paymentMethod);

  if (!orderResult) {
    return res.status(400).json({
      message: "Failed to create order"
    });
  }
  

  const {order, userAddress, user} = orderResult

  const result = {
    id: order.id,
    storeId: storeId,
    status: order.status,
    sub_total: order.totalPrice,
    discount: order.discountTotal,
    finalPrice: order.finalPrice,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    user : {
      receiverName : user.fullName,
      receiverNumber : user.phoneNumber,
      shippingAddress: userAddress.address
    },
  };

  return res.status(201).json({
    message: "Order created successfully",
    data: result
  });
};

export const cancelOrderController = async (req: Request, res: Response)  => {
  const { userId } = res.locals.payload;
  const {orderId} = req.params

  const order = await cancelOrderService(orderId);

  const cancelledOrder = {
      id: order.id,
      storeId: order.storeId,
      status: order.status,
      sub_total : order.totalPrice,
      discount : order.discountTotal,
      finalPrice: order.finalPrice,
      createdAt : order.createdAt
    }

  return res.status(200).json({
    message: "Order cancelled successfully",
    data: cancelledOrder,
  });
  
}

export const confirmOrderController = async (req: Request, res: Response)  => {
  const { userId } = res.locals.payload;
  const {orderId} = req.params

  const order = await confirmOrderService(orderId);

  const confirmOrder = {
      id: order.id,
      storeId: order.storeId,
      status: order.status,
      sub_total : order.totalPrice,
      discount : order.discountTotal,
      finalPrice: order.finalPrice,
      updatedAt : order.updatedAt
    }

  return res.status(200).json({
    message: "Order has been delivered to the costumer",
    data: confirmOrder,
  });
  
}


export const getOrderDetailController = async (req: Request, res: Response) => {
  const {orderId} = req.params;
  const { userId } = res.locals.payload;

  const order = await getOrderDetailService(userId, orderId);

  const orderDetail = {
    id : order?.id,
    status: order?.status,
    totalPrice: order?.totalPrice,
    discount : order?.discountTotal,
    finalPrice: order?.finalPrice,
    createdAt: order?.createdAt,
    items: order?.OrderItems.map((item)=> ({
      quantity: item.quantity,
      price: item.price,
      subTotal :item.subTotal,
      product : {
        name :item.product.name
      }
    })),
    totalItems: order?.OrderItems.reduce((acc, item) => acc + item.quantity, 0)
  }

  return res.status(200).json({
    message: "Orders detail fetched successfully",
    data: orderDetail
   })
}

export const getOrdersByUserController = async (req: Request, res: Response) => {
  const { userId } = res.locals.payload;

  const orders = await getOrdersByUserIdService(userId);

  const orderList = orders.map((order)=>({
    id: order.id,
    storeId: order.storeId,
    status: order.status,
    sub_total : order.totalPrice,
    discount : order.discountTotal,
    finalPrice: order.finalPrice,
    createdAt : order.createdAt,
    updatedAt : order.updatedAt
  }))
  
  return res.status(200).json({
    message: "Orders fetched successfully",
    data: orderList,
  });
};