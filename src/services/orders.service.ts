import { prisma } from "../db/connection";
import { OrderStatus, PaymentMethod } from "../generated/prisma";
import { IOrderResult } from "../types/order";
import { validateAndCalculateDiscounts } from "./discount.service";
import { gatewayPaymentService } from "./payment.service";

export const createOrderService = async (
userId: string, storeId: string, couponCodes: string[], paymentMethod: PaymentMethod) => {
  // 1. Buat order, update stok, diskon, cart, dll. di dalam transaksi
  const orderResult = await prisma.$transaction(async (tx) => {
    const cart = await tx.shoppingCart.findFirst({
      where: { userId, isActive: true },
      include: {
        ShoppingCartItem: {
          include: {
            product: { include: { stocks: true } },
          },
        },
      },
    });

    if (!cart || cart.ShoppingCartItem.length === 0) {
      throw { message: "Cart is empty", isExpose: true };
    }

    // Cek stok tiap item
    for (const item of cart.ShoppingCartItem) {
      const localStock = item.product.stocks.find((s) => s.storeId === storeId);
      const localQty = localStock ? localStock.quantity : 0;
      const globalQty = item.product.stocks.reduce((acc, stock) => acc + stock.quantity, 0);

      if (item.quantity > localQty && item.quantity > globalQty) {
        throw { message: `Stock is not enough for product: ${item.product.name}` };
      }
    }

    const cartItems = cart.ShoppingCartItem.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.price),
      subTotal: Number(item.price) * item.quantity,
    }));

    const totalPrice = cart.ShoppingCartItem.reduce(
      (acc, item) => acc + item.quantity * Number(item.price),
      0
    );

    // Ambil alamat default user
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { UserAddress: { where: { isDefault: true }, take: 1 } },
    });

    if (!user || user.UserAddress.length === 0) {
      throw { message: "Default shipping address not found", isExpose: true };
    }

    const userAddress = user.UserAddress[0];

    // Hitung diskon
    const { discountAmount, appliedDiscountIds, extraItems } =
      await validateAndCalculateDiscounts(tx, couponCodes, userId, totalPrice, storeId, cartItems);

    const finalPrice = Number((Math.max(0, totalPrice - discountAmount)).toFixed(2));

    const combinedItems = [
      ...cart.ShoppingCartItem.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subTotal: item.quantity * Number(item.price),
      })),
      ...extraItems,
    ];

    

    const order = await tx.order.create({
      data: {
        userId,
        storeId,
        totalPrice,
        discountTotal: discountAmount,
        finalPrice,
        status: OrderStatus.WAITING_FOR_PAYMENT,
        appliedDiscountIds,
        paymentMethod,
        OrderItems: { create: combinedItems.map((item) => ({ ...item })) },
            ...(paymentMethod === PaymentMethod.BANK_TRANSFER && {
          expiredAt: new Date(Date.now() + 60 * 60 * 1000),
        }),
      },
    });

    // Update stok dan history
    for (const item of cart.ShoppingCartItem) {
      const stockRecord = await tx.stock.findFirst({ where: { productId: item.productId, storeId } });
      if (!stockRecord) throw { message: `No stock found for product: ${item.product.name}` };

      const newQty = stockRecord.quantity - item.quantity;
      if (newQty < 0) throw { message: `Stock is not enough for product: ${item.product.name}` };

      await tx.stock.update({ where: { id: stockRecord.id }, data: { quantity: newQty } });
      await tx.stockHistory.create({
        data: {
          stockId: stockRecord.id,
          quantityOld: stockRecord.quantity,
          quantityDiff: item.quantity,
          quantityNew: newQty,
          changeType: "DECREASE",
          journalType: "PURCHASE",
          note: `Order #${order.id} untuk produk ${item.product.name}`,
          createdBy: "USER",
        },
      });
    }

    await tx.shoppingCartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.shoppingCart.update({ where: { id: cart.id }, data: { isActive: false } });

    await tx.orderStatusLog.create({
      data: {
        orderId: order.id,
        oldStatus: OrderStatus.INITIAL,
        newStatus: order.status,
        changedBy: "SYSTEM",
        note: `Order created with status ${order.status}`,
      },
    });

    // Buat redemption & increment useCount
    if (appliedDiscountIds?.length) {
      for (const discountId of appliedDiscountIds) {
        await tx.discountRedemption.create({ data: { discountId, userId, orderId: order.id } });
        await tx.discount.update({ where: { id: discountId }, data: { usesCount: { increment: 1 } } });
      }
    }

    return { order, userAddress, user: { fullName: user.fullName, phoneNumber: user.phoneNumber } };
  });

  if (paymentMethod === "SNAP") {
    const gatewayTransaction = await gatewayPaymentService(orderResult.order.id);
    return { ...orderResult, gatewayTransaction };
  }

  return orderResult;
};


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
                        quantityOld: oldQty,
                        quantityDiff: item.quantity,
                        quantityNew: newQty,
                        changeType: "INCREASE",
                        journalType: "RETURN",
                        note: `Return stock from cancelled order #${orderId}`,
                        createdBy: "USER"           
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


