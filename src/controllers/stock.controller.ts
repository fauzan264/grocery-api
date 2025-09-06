import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createStockForStore, updateStockQuantity } from "../services/stock.service";


export async function createStockHandler(req: AuthRequest, res: Response) {
try {
// ensure store ownership
const storeId = req.params.storeId as string;
const { productId, initialQuantity } = req.body as { productId: string; initialQuantity?: number };
const createdBy = req.user?.sub;
const stock = await createStockForStore(productId, storeId, initialQuantity ?? 0, createdBy);
return res.status(201).json({ success: true, data: stock });
} catch (err: unknown) {
const message = err instanceof Error ? err.message : String(err);
return res.status(400).json({ success: false, message });
}
}

export async function updateStockHandler(req: AuthRequest, res: Response) {
try {
const stockId = req.params.stockId as string;
const { delta, allowNegative } = req.body as { delta: number; allowNegative?: boolean };
const updated = await updateStockQuantity(stockId, delta, req.user?.sub, allowNegative ?? false);
return res.json({ success: true, data: updated });
} catch (err: unknown) {
const message = err instanceof Error ? err.message : String(err);
return res.status(400).json({ success: false, message });
}
}