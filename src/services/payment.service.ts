import { UploadApiResponse } from "cloudinary";
import { cloudinaryUpload } from "../lib/cloudinary.upload";
import { prisma } from "../db/connection";
import { OrderStatus, PaymentMethod } from "../generated/prisma";
import midtransClient from "midtrans-client";

type UploadPaymentInput = {
  orderId: string;
  imageFile: Express.Multer.File;
  userId: string; 
};

const snap = new midtransClient.Snap({
  isProduction: false, 
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export const gatewayPaymentService = async (orderId: string) => {
<<<<<<< Updated upstream
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { OrderItems: { include: { product: true } }, user: true },
    });

    if (!order) throw new Error("Order not found");
    if (!order.OrderItems.length) throw new Error("Order has no items");

    const parameter = {
      transaction_details: {
      order_id: order.id,
      gross_amount: Math.round(Number(order.finalPrice)), 
    },
      payment_type: "gopay",
      customer_details: {
        first_name: order.user.fullName,
        email: order.user.email,
        phone: order.user.phoneNumber,
      },
      item_details: order.OrderItems.map((item) => ({
        id: item.productId,
        price: Math.round(Number(item.price)),
        quantity: item.quantity,
        name: item.product.name,
      })),
      gopay: { enable_callback: true },
    };

    console.log("Snap parameter:", parameter);

    const transaction = await snap.createTransaction(parameter);
    return { redirect_url: transaction.redirect_url };
  } catch (err) {
    console.error("GatewayPaymentService error:", err);
    throw err;
  }
};


export const handleMidtransCallback = async (notification: any) => {
  const { order_id, transaction_status, fraud_status } = notification;

  const order = await prisma.order.findUnique({ where: { id: order_id } });
  if (!order) throw new Error("Order not found");

  let newStatus: OrderStatus | null = null;

  if (transaction_status === "settlement") {
    newStatus = OrderStatus.IN_PROCESS; 
  } else if (transaction_status === "pending") {
    newStatus = OrderStatus.WAITING_FOR_PAYMENT;
  } else if (
    transaction_status === "expire" ||
    transaction_status === "deny" ||
    transaction_status === "cancel"
  ) {
    newStatus = OrderStatus.CANCELLED;
  }

  if (newStatus && newStatus !== order.status) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order_id },
        data: { status: newStatus },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order_id,
          oldStatus: order.status,
          newStatus,
          changedBy: "SYSTEM",
          note: `Midtrans callback: ${transaction_status} (fraud=${fraud_status})`,
        },
      });
    });
  }

  return { ok: true };
};


=======
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      OrderItems: {
        include: { product: true },
      },
      user: true,
    },
  });

  if (!order) throw new Error("Order not found");

  const parameter = {
    transaction_details: {
      order_id: order.id,
      gross_amount: Number(order.finalPrice),
    },
    customer_details: {
      first_name: order.user.fullName,
      email: order.user.email,   
      phone: order.user.phoneNumber,
    },
    item_details: order.OrderItems.map((item) => ({
      id: item.productId,
      price: Number(item.price),
      quantity: item.quantity,
      name: item.product.name,
    })),
  };

  const transaction = await snap.createTransaction (parameter);
  return transaction;
};


>>>>>>> Stashed changes
export const uploadPaymentService = async ({
  orderId,
  imageFile,
  userId
}: UploadPaymentInput) => {
  
  const uploadResult = await cloudinaryUpload(imageFile.buffer, "payment_proof") as UploadApiResponse;
  const imageUrl = uploadResult.secureUrl; 

  console.log("Cloudinary result:", uploadResult);

  return await prisma.$transaction(async (tx) => {
    
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw { message: "Order not found", isExpose: true };

    const oldStatus = order.status;

    
    const updatedOrder = await tx.order.update({
      where: { id: orderId, paymentProof: null },
      data: {
        paymentProof: imageUrl,
        status: OrderStatus.WAITING_CONFIRMATION_PAYMENT,
      },
    });

    console.log("Updated order from DB:", updatedOrder);


    await tx.orderStatusLog.create({
      data: {
        orderId,
        oldStatus,
        newStatus: OrderStatus.WAITING_CONFIRMATION_PAYMENT,
        changedBy: "SYSTEM" ,
        note: `Payment proof uploaded, status changed from ${oldStatus} to WAITING_CONFIRMATION_PAYMENT `,
      },
    });

    return updatedOrder;
  });
};
