import { prisma } from "../../db/connection";
import { OrderStatus } from "../../generated/prisma";

export const expiryTransactionJobs = async () => {
  const oneHourAgo = new Date(Date.now() - 1000 * 60);

  const unpaidOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.WAITING_FOR_PAYMENT,
      createdAt: { lt: oneHourAgo },
    },
    include: {
      OrderItems: {
        include: {
          product: {
            include: { stocks: true },
          },
        },
      },
    },
  });

  console.log(`[CRON] Found ${unpaidOrders.length} unpaid orders older than 1 hour`);

  for (const order of unpaidOrders) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          oldStatus: order.status,
          newStatus: OrderStatus.CANCELLED,
          changedBy: "SYSTEM",
          note: "Order expired (no payment within 1 minute)",
        },
      });

      for (const item of order.OrderItems) {
        const stockRecord = item.product.stocks[0];
        if (!stockRecord) continue;

        const oldQty = stockRecord.quantity;
        const newQty = oldQty + item.quantity;

        await tx.stock.update({
          where: { id: stockRecord.id },
          data: { quantity: newQty },
        });

        await tx.stockJournal.create({
          data: {
            stockId: stockRecord.id,
            quantityOld: oldQty,
            quantityDiff: item.quantity,
            quantityNew: newQty,
            changeType: "INCREASE",
            journalType: "RETURN",
            reason: `Return stock from expired order #${order.id}`,
            createdBy: "SYSTEM",
          },
        });
      }
    });

    console.log(`[CRON] Order ${order.id} cancelled due to no payment`);
  }
};
