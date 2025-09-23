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
