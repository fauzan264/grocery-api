import { prisma } from "../db/connection";
import { UserRole } from "../generated/prisma";

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

export const getOrderDetailAdminService = async ({orderId, role, storeId}:{
    orderId :string,
    role: "SUPER_ADMIN" | "ADMIN_STORE",
    storeId? : string

}) => {
    return await prisma.order.findFirst({
        where: {
            id: orderId,
            ...role === "ADMIN_STORE"? {storeId} : {}
        },
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