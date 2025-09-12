import { Request, Response } from "express";
import { AddtoCartService, deleteCartService, getCartItemsService, updateCartItemService } from "../services/cart.service";

export const addtoCartController = async (req:Request, res:Response) => {
    const { user_id} = res.locals.payload;
    const { productId, quantity} = req.body;

    const Cart = await AddtoCartService ({
        user_id,
        productId,
        quantity: Number(quantity)
    });

    const cartItem = {
      id: Cart.cartId,
      productId: Cart.productId,
      productName: (Cart as any).product?.name,
      quantity: Cart.quantity,
      createdAt: Cart.createdAt,
      
    }
    
    return res.status(200).json({
        message: "Product added to cart successfully",
        data: cartItem
    })
}

export const updateCartItemController = async (req: Request, res: Response) => {
  const { userId } = res.locals.payload;
  const { id: itemId } = req.params;
  const { action } = req.body; 

  if (!["increment", "decrement"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

  const updatedItem = await updateCartItemService({
    userId,
    id: itemId,
    action,
  });

  return res.status(200).json({
    message: "Cart updated successfully",
    data: updatedItem,
  });
};

export const deleteCartController = async (req: Request, res: Response)  => {
    const { userId } = res.locals.payload;
    const { itemId } = req.params;

    const result = await deleteCartService ({userId, itemId});

    return res.status(200).json({
        message:result.message
    })
}

export const getCartItemsController = async (req: Request, res: Response) => {
  const { userId } = res.locals.payload;

  const cart = await getCartItemsService(userId);


  return res.status(200).json({
    message: "Cart fetched successfully",
    data: cart,
  });
};