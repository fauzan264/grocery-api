import { Request, Response } from "express";
import { approvePaymentService, cancelOrderAdminService,  declinePaymentService,  getAllOrdersAdminService, getOrderDetailAdminService,getOrderStatusLogsService } from "../services/adminOrder.service";

import { UserRole } from "../generated/prisma";


export const getAllOrdersAdminController = async (req: Request, res: Response) => {
  const { user_id, role, storeId } = res.locals.payload;

  if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN_STORE) {
    throw { status: 403, message: "Forbidden: You are not authorized to access this resource" };
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const { data: orders, meta } = await getAllOrdersAdminService({
    user_id, 
    role, 
    storeId,
    page,
    limit
  });

  const mappedOrders = orders.map((order) => ({
    orderId: order.id,
    storeId : order.storeId,
    status: order.status,
    createdAt: order.createdAt,
    totalPrice: order.totalPrice,
    discount: order.discountTotal,
    finalPrice: order.finalPrice,
    paymentMethod: order.paymentMethod,
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
    meta, 
    data: mappedOrders,
  });
};

export const getOrderDetailController = async (req: Request, res: Response) => {
  const { user_id, role } = res.locals.payload;
  const { orderId } = req.params;

  const order = await getOrderDetailAdminService({ orderId, role, userId: user_id });

  if (!order) {
    throw { status: 404, message: "Order not found or not accessible" };
  }

  const mappedOrder = {
  orderId: order.id,
  status: order.status,
  createdAt: order.createdAt,
  totalPrice: order.totalPrice,
  discount: order.discountTotal,
  shipment : order.Shipment?.shippingCost,  
  finalPrice: order.finalPrice,
  paymentMethod: order.paymentMethod,
  paymentProof: order.paymentProof,
  customer: {
    id: order.user.id,
    fullName: order.user.fullName,
    email: order.user.email,
    phoneNumber: order.user.phoneNumber,
    addresses: order.user.UserAddress.map((addr) => addr.address),
  },
  items: order.OrderItems.map((item) => {
      const localStock = item.product.stocks.find(
        s => s.storeId === order.store.id
      )?.quantity ?? 0;

      return {
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        stock: localStock,
        needGlobalStockRequest: localStock < item.quantity, 
        imageUrl: item.product.images?.[0]?.url || null,
        subTotal: item.subTotal,
      };
    }),
  store: order.store
    ? {
        id: order.store.id,
        name: order.store.name,
      }
    : null,
};


  return res.status(200).json({
    message: `Get order: ${orderId} detail successfully`,
    data: mappedOrder,
  });
};

export const approvePaymentController = async (req: Request, res: Response) => {
  const {user_id, fullName} = res.locals.payload
  const {orderId} = req.params

  const order = await approvePaymentService({user_id, orderId})
  
  const mappedOrder = {
      id: order.id,
      totalPrice: order.totalPrice,
      discount: order.discountTotal,
      finalPrice: order.finalPrice,
      paymentProof: order.paymentProof,
      status: order.status,
      storeId: order.storeId,
      userId: order.userId,
      approver: order.approver
    };

  return res.status(200).json({
    message: `Get order: ${orderId} detail successfully`,
    data: mappedOrder,
  });
}

export const declinePaymentController = async (req: Request, res: Response) => {
  const {user_id} = res.locals.payload
  const {orderId} = req.params

  const {statusLog, ...order} = await declinePaymentService({user_id, orderId})
  const filteredOrder = {
      id: order.id,
      paymentMethod: order.paymentMethod,
      paymentProof: order.paymentProof,
      updatedAt: order.updatedAt,
      updatedBy: order.decliner,
    };

  return res.status(200).json({
    success: true,
    message : "Payment Decline Successfully",
    data: {
      filteredOrder,
      statusLog
    }
  })
}
export const cancelOrderAdminController = async (req: Request, res: Response) => {
  const {user_id, storeId} = res.locals.payload
  const {orderId} = req.params

  console.log("Full Payload:", res.locals.payload);
  console.log("=== Controller Debug ===");
  console.log("Parameters:", { user_id, storeId, orderId });

  const order = await cancelOrderAdminService(
      user_id,
      orderId,
      storeId,
      "ADMIN_STORE"
    );
  const cancelOrder = {
    id: order.id,
    status : order.status,
    updatedAt : order.updatedAt,
    orderItems: order.OrderItems.map(item => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
    }))
  }

  return res.status(200).json({
    message: ` order: ${orderId} cancelled successfully`,
    data: cancelOrder,
  });
}

export const getOrderStatusLogController = async (req: Request, res: Response) => {
  const {user_id} = res.locals.payload
  const {orderId} = req.params

  const statusLog = await getOrderStatusLogsService (user_id, orderId)

  return res.status(200).json({
    message: `Get order: ${orderId} detail successfully`,
    data: statusLog
  });
}


