import { prisma } from "../db/connection";
import { IAddtoCart, IUpdateCart } from "../types/cart";

export const AddtoCartService = async({user_id, productId, quantity}: IAddtoCart) => {

    let cart = await prisma.shoppingCart.findFirst({
        where: {userId:user_id, isActive: true},
    })

    if(!cart) {
        cart = await prisma.shoppingCart.create({
            data: {userId:user_id}
        })
    }

    //Checing Existing Item
    const existingProduct = await prisma.shoppingCartItem.findFirst({
        where : {cartId:cart.id, productId}
    })

    if (existingProduct){
        return prisma.shoppingCartItem.update({
            where: {id:existingProduct.id},
            data: {
                quantity: existingProduct.quantity + quantity,
                subTotal: (existingProduct.quantity + quantity) * Number(existingProduct.price)
            }
        })
    }

    //Retrieve price from product db
    const product = await prisma.product.findFirstOrThrow({
        where: {id : productId},
        select: { price: true, name:true}
    });

    //add Product to cart
    return prisma.shoppingCartItem.create({
        data:{
            cartId: cart.id,
            productId,
            quantity,
            price: product.price,
            subTotal: Number(product.price) * quantity
        },
        include: {
            product:{
                select:{name:true}
            }
        }
    })

}

export const updateCartItemService = async ({
    userId,
    id: itemId,
    action
}: IUpdateCart) => {
    const cart = await prisma.shoppingCart.findFirst({
        where: {userId, isActive:true},
        include : {
            ShoppingCartItem: {
                where: {id : itemId}
            }
        }
    });

    if (!cart) {
        throw {message: "Active cart not found", isExpose: true}
    }

    const existingItem = cart.ShoppingCartItem[0];
    if (!existingItem) {
    throw { message: "Item not found in cart", isExpose: true };
    }

    let newQuantity = 
        action === "increment"
        ? existingItem.quantity + 1
        : existingItem.quantity - 1;

    if (newQuantity <= 0) {
        await prisma.shoppingCartItem.delete ({
            where: {id: existingItem.id}
        });
        return { message: "Item removed from cart"}
    }

    return prisma.shoppingCartItem.update({
        where: {id:existingItem.id},
        data: {
            quantity: newQuantity,
            subTotal: Number(existingItem.price) * newQuantity,
        },
        include: {
            product: { select: {name: true, price: true}}
        }
    })
}

export const deleteCartService = async ({
    userId,
    itemId
}: {userId: string; itemId:string}) => {
    const cart = await prisma.shoppingCart.findFirst({
        where: {userId, isActive:true},
        include : {
            ShoppingCartItem: {
                where: {id : itemId}
            }
        }
    });

    if (!cart) {
        throw {message: "Active cart not found", isExpose: true}
    }

    const existingItem = cart.ShoppingCartItem[0];
    if (!existingItem) {
    throw { message: "Item not found in cart", isExpose: true };
    }

    await prisma.shoppingCartItem.delete({
        where: {id: existingItem.id}
    });

    return {message: "Item removed from cart successfully" }
}



export const getCartItemsService = async (userId: string) => {
  const cart = await prisma.shoppingCart.findFirst({
    where: { userId, isActive: true },
    include: {
      ShoppingCartItem: {
        include: {
          product: { select: { name: true, price: true } },
        },
      },
    },
  });

  if (!cart) {
    return { message: "Cart is empty", items: [] };
  }

  return { items: cart.ShoppingCartItem };
};