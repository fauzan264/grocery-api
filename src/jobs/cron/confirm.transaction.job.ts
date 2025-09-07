import { prisma } from "../../db/connection";
import { OrderStatus } from "../../generated/prisma";

export const confirmTransactionJob = async () => {
  const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);

  const unconfirmedOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.DELIVERED, 
      createdAt: { lt: twoDaysAgo },
    },
  });

  console.log(
    `[CRON] Found ${unconfirmedOrders.length} delivered orders older than 2 days`
  );

  for (const order of unconfirmedOrders) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.ORDER_CONFIRMATION, 
      },
    });

    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: OrderStatus.ORDER_CONFIRMATION,
        changedBy: "SYSTEM",
        note: "Order auto-confirmed by system after 2 days in DELIVERED state",
      },
    });

    console.log(
      `[CRON] Order ${order.id} auto-confirmed after 2 days in DELIVERED state`
    );
  }
};
