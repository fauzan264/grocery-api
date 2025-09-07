import { prisma } from "../../db/connection";
import { OrderStatus } from "../../generated/prisma";

export const expiryTransactionJobs = async () => {
    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);

    const unpaidOrders = await prisma.order.findMany({
        where: {
            status: OrderStatus.WAITING_FOR_PAYMENT,
            createdAt: {lt: oneHourAgo}
        }
    })

    for (const order of unpaidOrders) {
        console.log(`[CRON] Order ${order.id} cancelled due to no payment`);
    }
}