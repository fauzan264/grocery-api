import { Request, Response } from "express";
import { approvePaymentService, cancelOrderAdminService, getAllOrdersAdminService, getOrderDetailAdminService } from "../services/adminOrder.service";
import { formatDateJakarta } from "../utils/date";
import { UserRole } from "../generated/prisma";

export const getAllOrdersAdminController = async (req: Request, res: Response) => {
    
  const { user_id, role, storeId } = res.locals.payload;
  console.log("DEBUG JWT Payload:");
  console.log("user_id:", user_id);
  console.log("role:", role);
  console.log("storeId:", storeId);

  if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN_STORE) {
    throw { status: 403, message: "Forbidden: You are not authorized to access this resource" };
  }

  const orders = await getAllOrdersAdminService({user_id, role, storeId});

  const mappedOrders = orders.map((order) => ({
    orderId: order.id,
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
    data: mappedOrders
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
  items: order.OrderItems.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    stock: item.product.stocks,
    imageUrl: item.product.images?.[0]?.url || null, 
    subTotal: item.subTotal,
  })),
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

export const cancelOrderAdminController = async (req: Request, res: Response) => {
  const {userId, storeId} = res.locals.payload
  const {orderId} = req.params

  console.log("Full Payload:", res.locals.payload);

  const order = await cancelOrderAdminService(userId, orderId, storeId);




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
