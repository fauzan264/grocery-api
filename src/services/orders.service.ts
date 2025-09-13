import { prisma } from "../db/connection";
import { OrderStatus } from "../generated/prisma";
import { cloudinaryUpload } from "../lib/cloudinary.upload";

export const createOrderService = async (userId: string, storeId: string) => {
    return await prisma.$transaction(async(tx)=> {
        const cart = await tx.shoppingCart.findFirst({
            where:{userId, isActive: true},
            include: {
                ShoppingCartItem: {
                    include: {
                        product: {
                            include: {stocks: true}
                    }
                    }
                }
            }
        });

        if (!cart || cart.ShoppingCartItem.length === 0) {
            throw { message: "Cart is empty", isExpose: true };
        }

        for (const item of cart.ShoppingCartItem) {
            const localStock = item.product.stocks.find(
                (s) => s.storeId === storeId
            )

            const localQty = localStock ? localStock.quantity : 0;
            const globalQty = item.product.stocks.reduce(
                (acc, stock) => acc + stock.quantity,0
            )

            if (item.quantity > localQty && item.quantity > globalQty){
                throw {
                    message: `Stock is not enough for product: ${item.product.name}`
                }
            }

        }

        const totalPrice = cart.ShoppingCartItem.reduce(
            (acc, item) => acc + item.quantity*item.price,0
        )

        const discount = 0
        const finalPrice = totalPrice - discount

        const order = await tx.order.create({
            data: {
                userId,
                storeId,
                totalPrice,
                discount,
                finalPrice,
                status: OrderStatus.WAITING_FOR_PAYMENT,
                OrderItems: {
                    create: cart.ShoppingCartItem.map((item)=>{
                        return {
                        productId : item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        subTotal: item.quantity * item.price,
                        }
                    })
                }
            },
        })

        for (const item of cart.ShoppingCartItem) {
            const stockRecord = await tx.stock.findFirst({
                where: {
                    productId: item.productId,
                    storeId: storeId,
                }
            }) 

            if (!stockRecord){
                throw {
                    message: `No stock found for product: ${item.product.name} in store ${storeId}`,
                }
            }

            const orderQty = stockRecord.quantity;
            const newQty = orderQty - item.quantity;

            await tx.stock.update({
                where: {id: stockRecord.id},
                data: {
                    quantity: newQty
                }
            })

            await tx.stockHistory.create({
                data: {
                    stockId: stockRecord.id,
                    oldQuantity: orderQty,
                    quantityChange: item.quantity,
                    newQuantity: newQty,
                    changeType: "DECREASE",   // enum StockChangeType
                    journalType: "PURCHASE",  // enum StockJournalType
                    userId: "USER",            // pastikan ini ID user yang valid
                }
            })

        await tx.shoppingCartItem.deleteMany({
            where: { cartId : cart.id},
        })

        await tx.shoppingCart.update({
            where: {id: cart.id},
            data : {isActive: false}
        })

        await tx.orderStatusLog.create({
            data:{
                orderId:order.id,
                oldStatus: OrderStatus.INITIAL,
                newStatus: order.status,
                changedBy:"SYSTEM",
                note: `Order created with status ${order.status}`
            }
        })

            return order
         }
    });
}

export const cancelOrderService = async (orderId: string) => {
    return await prisma.$transaction(async(tx) => {
        const order = await tx.order.findUnique({
            where: {id : orderId},
            include: {
            OrderItems: {
                include:{
                    product: {
                        include: {stocks:true}
                    }
                }
            }
        }
        });

        if(!order) {
            throw { message: "Order not found", isExpose: true };
        }

        if (order.status !== OrderStatus.WAITING_FOR_PAYMENT) {
            throw { message: "Only unpaid orders can be cancelled", isExpose: true };
        }

        const cancelOrder = await tx.order.update({
            where: {id: orderId},
            data: {status: OrderStatus.CANCELLED}
        })

        for (const item of order.OrderItems){
            const stocksRecord = item.product.stocks[0]
            if (stocksRecord) {
                const oldQty = stocksRecord.quantity
                const newQty = oldQty + item.quantity
                await tx.stock.update({
                    where: {id : stocksRecord.id},
                    data: {quantity: newQty}
                })

                await tx.stockHistory.create({
                    data: {
                        stockId: stocksRecord.id,
                        oldQuantity: oldQty,            // sebelumnya quantityOld
                        quantityChange: item.quantity,   // sebelumnya quantityDiff
                        newQuantity: newQty,             // sebelumnya quantityNew
                        changeType: "INCREASE",          // enum StockChangeType
                        journalType: "RETURN",           // enum StockJournalType
                        userId: "USER"                   // harus ID user valid, bukan string bebas
                    }
                })
            }
        }

        await tx.orderStatusLog.create({
            data:{
                orderId:order.id,
                oldStatus: order.status,
                newStatus: OrderStatus.CANCELLED,
                changedBy:"USER",
                note: "Order cancelled by user"
            }
        })

        return cancelOrder
    })
}

export const confirmOrderService = async (orderId: string) => {
    return await prisma.$transaction(async(tx) => {
        const order = await tx.order.findUnique({
            where: {id : orderId}
        })

        if(!order) {
            throw { message: "Order not found", isExpose: true };
        }

        if (order.status !== OrderStatus.DELIVERED) {
            throw { message: "Only delivered order can be confirmed", isExpose: true };
        }

        const confirmOrder = await tx.order.update({
            where: {id: orderId},
            data: {status: OrderStatus.ORDER_CONFIRMATION}
        })

        await tx.orderStatusLog.create({
            data:{
                orderId:order.id,
                oldStatus: order.status,
                newStatus: OrderStatus.ORDER_CONFIRMATION,
                changedBy:"USER",
                note: "Order has been delivered"
            }
        })
        return confirmOrder
    }) 
}

export const getOrderDetailService = async (userId:string, orderId:string) => {
    return await prisma.order.findFirst({
        where: { id:orderId, userId},
        include : {
            OrderItems: {
                include: {product:true}
            }
        }
    });
}

export const getOrdersByUserIdService = async (userId: string) => {
  return await prisma.order.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
  });
};


