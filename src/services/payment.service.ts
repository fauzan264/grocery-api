import { UploadApiResponse } from "cloudinary";
import { cloudinaryUpload } from "../lib/cloudinary.upload";
import { prisma } from "../db/connection";
import { OrderStatus } from "../generated/prisma";

type UploadPaymentInput = {
  orderId: string;
  imageFile: Express.Multer.File;
  userId: string; 
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
