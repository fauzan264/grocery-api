import { Request, Response } from "express";
import { AddtoCartService, deleteCartService, getCartItemsService, updateCartItemService } from "../services/cart.service";

export const addtoCartController = async (req:Request, res:Response) => {
    const { userId } = res.locals.payload;
    const { productId, quantity} = req.body;

    const cartItem = await AddtoCartService ({
        userId,
        productId,
        quantity: Number(quantity)
    });

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

  const result = await getCartItemsService(userId);

  return res.status(200).json({
    message: "Cart fetched successfully",
    data: result.items,
  });
};