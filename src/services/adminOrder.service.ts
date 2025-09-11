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
  return await prisma.order.findFirst({
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
        include: { product: true }
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
