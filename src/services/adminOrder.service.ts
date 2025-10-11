import { error } from "console";
import { prisma } from "../db/connection";
import { Order, OrderStatus, UserRole } from "../generated/prisma";

export const getAllOrdersAdminService = async ({user_id, role, storeId} : {user_id?: string; role: "SUPER_ADMIN" | "ADMIN_STORE", storeId?: string}) => {
    return await prisma.order.findMany({
        where: role === "SUPER_ADMIN" ? {} : { storeId },
        orderBy: {
            createdAt: "desc"
        },
        include: {
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
        }

    })
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
              stocks: true,
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
      }
    }
  });
  if (!order) {
     throw { message: "Order not found", isExpose: true };
  }
  return order
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

export const cancelOrderAdminService = async (userId:string, role: string, orderId:string) => {
  return await prisma.$transaction(async(tx) => {
    const order = await tx.order.findFirst({
      where: {
        id:orderId,
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
          include: {product:{include:{stocks:true}}}
        }
      }
    })

    if(!order){
      throw {message: "Order not found", isExpose:true}
    }


    if(order.status !== OrderStatus.WAITING_CONFIRMATION_PAYMENT && order.status !== OrderStatus.IN_PROCESS){
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

    for (const item of order.OrderItems){
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
