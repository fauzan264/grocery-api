import { Request, Response } from "express";
import { getAllOrdersAdminService, getOrderDetailAdminService } from "../services/adminOrder.service";
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

export const getOrderDetailController =  async (req: Request, res: Response) => {
  const { role, storeId} = res.locals.payload
  const { orderId } = req.params;

  console.log("DEBUG JWT Payload:");
  console.log("role:", role);
  console.log("storeId:", storeId);

  if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN_STORE) {
      throw { status: 403, message: "Forbidden: You are not authorized to access this resource" };
    }

  const order = await getOrderDetailAdminService({role, storeId, orderId});

  if (!order) {
    throw { status: 404, message: "Order not found or not accessible" };
  }

  const mappedOrder = {
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
      addresses: order.user.UserAddress.map((a) => a.address),
    },
    items: order.OrderItems.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      price: item.price,
      quantity: item.quantity,
      subTotal: item.subTotal,
    })),
  };

  return res.status(200).json({
    message: `Get order: ${orderId} detail sucessfully`,
    data: mappedOrder
  });
};  
