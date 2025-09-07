import { prisma } from "../db/connection";
import { OrderStatus } from "../generated/prisma";
import { cloudinaryUpload } from "../lib/cloudinary.upload";

export const createOrderService = async (userId: string) => {
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
            const availableStock = item.product.stocks.reduce (
                (acc, stock) => acc + stock.quantity,0
            )

            if (item.quantity > availableStock) {
                throw {
                    message: `Stock is not enough for product: ${item.product.name}`
                }
            }
        }

        const totalPrice = cart.ShoppingCartItem.reduce(
            (acc, item) => acc + item.quantity*item.product.price,0
        )

        const discount = 0
        const finalPrice = totalPrice - discount

        const order = await tx.order.create({
            data: {
                userId,
                totalPrice,
                discount,
                finalPrice,
                status: OrderStatus.WAITING_FOR_PAYMENT,
                OrderItems: {
                    create: cart.ShoppingCartItem.map((item)=>{
                        return {
                        productId : item.productId,
                        quantity: item.quantity,
                        price: item.product.price,
                        subTotal: item.quantity * item.product.price,
                        }
                    })
                }
            },
            include: {
                OrderItems: true,
                user: true
            }
        })

        for (const item of cart.ShoppingCartItem) {
            const totalStock = item. product.stocks.reduce(
                (acc, stock) => acc + stock.quantity, 0
            )

            const stockRecord = item.product.stocks[0]; 

            await tx.stock.update({
                where: {id: stockRecord.id},
                data: {
                    quantity: totalStock - item.quantity
                }
            })
        }

        await tx.shoppingCartItem.deleteMany({
            where: { cartId : cart.id},
        })

        await tx.shoppingCart.update({
            where: {id: cart.id},
            data : {isActive: false}
        })

        const initialOrder = await tx.order.findUnique ({where: {id:order.id}})
        if (!initialOrder) throw { message: "Order not found", isExpose: true };

        const oldStatus = "None"
        await tx.orderStatusLog.create({
            data:{
                orderId:order.id,
                oldStatus: OrderStatus.INITIAL,
                newStatus: order.status,
                changedBy:userId || "system",
                note: `Order created with status ${order.status}`
            }
        })

        return order

    });
}

export const getOrdersByUserIdService = async (userId: string) => {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      OrderItems: {
        include: {
          product: true, 
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};


