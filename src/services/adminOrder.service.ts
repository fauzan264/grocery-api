import { prisma } from "../db/connection";

export const getAllOrdersAdminService = async () => {
    return await prisma.order.findMany({
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