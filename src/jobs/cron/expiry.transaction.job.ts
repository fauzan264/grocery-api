import { prisma } from "../../db/connection";
import { OrderStatus } from "../../generated/prisma";

export const expiryTransactionJobs = async () => {
    const oneHourAgo = new Date(Date.now() - 1000 * 60 );

    const unpaidOrders = await prisma.order.findMany({
        where: {
            status: OrderStatus.WAITING_FOR_PAYMENT,
            createdAt: {lt: oneHourAgo}
        },
        include: {
            OrderItems: {
                include:{
                    product: {
                        include: {stocks:true}
                    }
                }
            }
        }
    })
    console.log(`[CRON] Found ${unpaidOrders.length} unpaid orders older than 1 hour`);

    for (const order of unpaidOrders) {

        for (const item of order.OrderItems){
            const stocksRecord = item.product.stocks[0]
            if (stocksRecord) {
                await prisma.stock.update({
                    where: {id : stocksRecord.id},
                    data: {
                        quantity: stocksRecord.quantity+ item.quantity
                    }
                })
            }
        }

        await prisma.order.update({
            where: {id: order.id},
            data: {
                status: OrderStatus.CANCELLED
            }
        })
        await prisma.orderStatusLog.create({
            data: {
                orderId: order.id,
                oldStatus: order.status,
                newStatus: OrderStatus.CANCELLED,
                changedBy: "SYSTEM" ,
                note: 'Order expired (no payment within 1 hour)',
            }
        })
        console.log(`[CRON] Order ${order.id} cancelled due to no payment`);
    }
}