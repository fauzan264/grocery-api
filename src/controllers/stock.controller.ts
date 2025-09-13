import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
createStockForStore,
updateStockQuantity,
setStockAbsolute,
createOrUpdateStock,
transferStockBetweenStores,
getStockById,
listStockByStore,
getProductStocks
} from "../services/stock.service";

export async function createStockHandler(req: AuthRequest, res: Response) {
try {
let storeId = (req.params.storeId as string) || (req.body?.storeId as string);
const { productId, initialQuantity } = req.body as { productId: string; initialQuantity?: number };
const createdBy = req.user?.sub as string | undefined;


if (!createdBy) return res.status(401).json({ success: false, message: "Unauthorized: user id required" });


if (req.user?.role !== "SUPER_ADMIN") {
const stores = req.user?.stores || [];
if (!storeId) {
if (stores.length === 0) return res.status(400).json({ success: false, message: "storeId required" });
storeId = stores[0];
}
if (!stores.includes(storeId)) return res.status(403).json({ success: false, message: "You don't manage this store" });
}


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
const { delta, setAbsolute, allowNegative } = req.body as { delta?: number; setAbsolute?: number; allowNegative?: boolean };
const createdBy = req.user?.sub as string | undefined;
if (!createdBy) return res.status(401).json({ success: false, message: "Unauthorized: user id required" });


if (typeof setAbsolute !== "undefined") {
const updated = await setStockAbsolute(stockId, setAbsolute, createdBy);
return res.json({ success: true, data: updated });
}


if (typeof delta !== "number") return res.status(400).json({ success: false, message: "delta number required" });


const updated = await updateStockQuantity(stockId, delta, createdBy, allowNegative ?? false);
return res.json({ success: true, data: updated });
} catch (err: unknown) {
const message = err instanceof Error ? err.message : String(err);
return res.status(400).json({ success: false, message });
}
}

export async function transferStockHandler(req: AuthRequest, res: Response) {
try {
const { productId, fromStoreId, toStoreId, qty } = req.body as { productId: string; fromStoreId: string; toStoreId: string; qty: number };
const performedBy = req.user?.sub as string | undefined;
if (!performedBy) return res.status(401).json({ success: false, message: "Unauthorized: user id required" });


if (!productId || !fromStoreId || !toStoreId || !qty) return res.status(400).json({ success: false, message: "Missing fields" });


if (req.user?.role !== "SUPER_ADMIN") {
const stores = req.user?.stores || [];
if (!stores.includes(fromStoreId)) return res.status(403).json({ success: false, message: "You don't manage source store" });
}


const result = await transferStockBetweenStores(productId, fromStoreId, toStoreId, qty, performedBy);
return res.json({ success: true, data: result });
} catch (err: unknown) {
const message = err instanceof Error ? err.message : String(err);
return res.status(400).json({ success: false, message });
}
}

export async function getStockHandler(req: AuthRequest, res: Response) {
try {
const stockId = req.params.stockId as string;
const stock = await getStockById(stockId);
if (!stock) return res.status(404).json({ success: false, message: "Stock not found" });
return res.json({ success: true, data: stock });
} catch (err: unknown) {
const message = err instanceof Error ? err.message : String(err);
return res.status(400).json({ success: false, message });
}
}

export async function listStockByStoreHandler(req: AuthRequest, res: Response) {
  try {
    let storeId = (req.params.storeId as string) || (req.query.storeId as string);

    if (req.user?.role !== "SUPER_ADMIN") {
      const stores = req.user?.stores || [];
      if (!storeId) storeId = stores[0];
      if (!stores.includes(storeId))
        return res.status(403).json({ success: false, message: "You don't manage this store" });
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const data = await listStockByStore(storeId, page, limit);

    return res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ success: false, message });
  }
}

export async function getStocksByProductHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { productId } = req.params as { productId: string };
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const authUser = {
      sub: req.user.sub,
      role: req.user.role,
      stores: (req.user as any).stores ?? [],
    };

    const data = await getProductStocks(productId, authUser, page, limit);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(400).json({ success: false, message });
  }
}