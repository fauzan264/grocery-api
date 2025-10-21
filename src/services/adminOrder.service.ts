
import { prisma } from "../db/connection";
import { Order, OrderStatus, UserRole } from "../generated/prisma";

export const getAllOrdersAdminService = async ({
  user_id, 
  role, 
  storeId,
  page = 1,
  limit = 10
} : {
  user_id?: string;
  role: "SUPER_ADMIN" | "ADMIN_STORE",
  storeId?: string
  page?: number;
  limit?: number;

}) => {
  let whereClause: Record<string, any> = {};

  if (role === UserRole.SUPER_ADMIN) {
    if(storeId) {
      whereClause.storeId = storeId
    }
  } else if (role === UserRole.ADMIN_STORE) {
    if (!user_id) {
       throw { message: "User Id is required", isExpose: true };
    }

    const userStore = await prisma.userStore.findFirst({
      where: { userId: user_id },
      select: { storeId: true },
    });

    if (!userStore) {
      throw { message: "Admin store not linked to any store", isExpose: true };
    }
    whereClause.storeId = userStore.storeId;
  }
    const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where:whereClause,
          orderBy: {
              createdAt: "desc"
          },
          include: {
            store: { select: { id: true, name: true } },
            OrderItems: {
                include: {
                      product: true
                }
              },
              user: {
                  select: {
                      id: true,
                      fullName:true, 
                      email:true,
                      phoneNumber:true,
                      UserAddress: {
                          select:{
                              address: true
                          }
                      }
                  }
              }
          },
          skip: (page - 1) * limit,
          take: limit,
      }),
       prisma.order.count({ where: whereClause }),
    ])
    return {
    data: orders,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


export const getOrderDetailAdminService = async ({
  orderId,
  userId,
  role
}: {
  orderId: string;
  userId: string;
  role: "SUPER_ADMIN" | "ADMIN_STORE";
}) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(role === "ADMIN_STORE"
        ? {
            store: {
              UserStore: {
                some: {
                  userId 
                }
              }
            }
          }
        : {})
    },
    include: {
      OrderItems: {
        select: {
          id: true,
          quantity: true,
          subTotal:true,
          product : {
            select: {
              id : true,
              name: true,
              price: true,
              stocks: {
                where: {storeId: undefined}
              },
              images : {
                where : {isPrimary:true},
                select : {url: true},
                take: 1
              }
            }
          }
        },  
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          UserAddress: { select: { address: true } }
        }
      },
      store: {
        select: {
          id: true,
          name: true
        }
      },
      Shipment: {
        select: {
          shippingCost: true
        }
      }
    }
  });
  if (!order) {
     throw { message: "Order not found", isExpose: true };
  }
  const orderWithLocalStock = {
    ...order,
    OrderItems: order.OrderItems.map(item => {
      const localStockRecord = item.product.stocks.find(
        s => s.storeId === order.store.id 
      );
      const localQuantity = localStockRecord?.quantity ?? 0;
      const needGlobalStockRequest = localQuantity < item.quantity;

      return {
        ...item,
        localStock: localQuantity,
        needGlobalStockRequest
      };
    })
  };
   return orderWithLocalStock;
};

export const approvePaymentService = async ({user_id, orderId}:{
  user_id : string
  orderId : string,
}) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id : orderId,
        status : OrderStatus.WAITING_CONFIRMATION_PAYMENT
      }
    })

    if(!order){
      throw { message: "No Order Found", isExpose: true }
    }

    const user = await tx.user.findUnique({
      where: { id: user_id },
      select: { fullName: true },
    });

    if (!user) {
      throw { message: "Approver not found", isExpose: true };
    }

    const updateOrder = await tx.order.update ({
      where : {id: orderId},
      data: {
        status: OrderStatus.IN_PROCESS
      }
    })

    
    await tx.orderStatusLog.create({
            data:{
                orderId:order.id,
                oldStatus: OrderStatus.WAITING_CONFIRMATION_PAYMENT,
                newStatus: updateOrder.status,
                changedBy:`ADMIN (${user.fullName})`,
                note: `Payment Approve for order: ${orderId}`
            }
        })
    return {...updateOrder, approver: user.fullName}
  })
}

export const declinePaymentService = async ({user_id, orderId}:{
  user_id : string
  orderId : string,
}) => {
  return await prisma.$transaction(async(tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        status : OrderStatus.WAITING_CONFIRMATION_PAYMENT
      }
    })

     if(!order){
      throw { message: "No Order Found", isExpose: true }
    }

    const user = await tx.user.findUnique({
      where: { id: user_id },
      select: { fullName: true },
    });

    if (!user) {
      throw { message: "Approver not found", isExpose: true };
    }

    const updateOrder = await tx.order.update ({
      where : {id: orderId},
      data: {
        status: OrderStatus.WAITING_FOR_PAYMENT
      }
    })

    const statusLog = await tx.orderStatusLog.create({
            data:{
                orderId:order.id,
                oldStatus: OrderStatus.WAITING_CONFIRMATION_PAYMENT,
                newStatus: updateOrder.status,
                changedBy:`ADMIN (${user.fullName})`,
                note: `Payment Declined due to invalid payment proof for order: ${orderId}`
            }
        })
        return { ...updateOrder, decliner: user.fullName, statusLog };
  })
}

export const cancelOrderAdminService = async (
  userId: string,
  orderId: string,
  storeId: string,
  role: string = "ADMIN_STORE") => {
  return await prisma.$transaction(async(tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId
      },
      include: {
        OrderItems: {
          include: { product: { include: { stocks: true } } }
        },
        store: {
          select: { id: true, name: true }
        }
      }
    });

    if(!order){
      throw {message: "Order not found", isExpose:true}
    }


    if(order.status !== OrderStatus.WAITING_FOR_PAYMENT && order.status !== OrderStatus.WAITING_CONFIRMATION_PAYMENT && order.status !== OrderStatus.IN_PROCESS){
      throw{ message: `Order with status ${order.status} can not be cancelled`}
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    if (!user) {
      throw { message: "Admin Store not found", isExpose: true };
    }
    
    const oldStatus = order.status; 

    const cancelOrder = await tx.order.update({
      where:{ id: orderId},
      data: {
        status: OrderStatus.CANCELLED
      },
      include: {
        OrderItems: {
          include: {product: {include:{stocks:true}}}
        }
      }
    })

    for (const item of cancelOrder.OrderItems){
            const stocksRecord = item.product.stocks.find(s => s.storeId === order.storeId);
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
                        journalType: "PURCHASE",
                        note: `Return stock from cancelled order #${orderId}`,
                        createdBy: `ADMIN (${user.fullName})`
                    }
                })
            }
        }

    await tx.orderStatusLog.create({
            data:{
                orderId:order.id,
                oldStatus: oldStatus,
                newStatus: cancelOrder.status,
                changedBy:`ADMIN (${user.fullName})`,
                note: `Order cancelled for order: ${orderId}`
            }
        });

        return cancelOrder
  })
}

export const getOrderStatusLogsService = async (userId:string, orderId: string) => {
  return await prisma.orderStatusLog.findMany({
    where: { orderId },
    orderBy: {
      createdAt: "asc", 
    },
  });
};
