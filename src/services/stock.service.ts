import { prisma } from "../db/connection";
import { paginateResponse } from "../utils/pagination";
import { Prisma } from "../generated/prisma";

const MAX_RETRY = 3;

export async function createStockForStore(productId: string, storeId: string, initialQuantity = 0, createdBy: string) {
  if (!createdBy) throw new Error("createdBy (userId) is required for audit");
  if (!productId || !storeId) throw new Error("productId and storeId are required");

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.stock.findUnique({
      where: { productId_storeId: { productId, storeId } },
    });

    if (existing) throw new Error("Stock already exists for this product and store");

    const stock = await tx.stock.create({ data: { productId, storeId, quantity: initialQuantity } });

    await tx.stockHistory.create({
      data: {
        stockId: stock.id,
        quantityOld: 0,
        quantityDiff: stock.quantity,
        quantityNew: stock.quantity,
        note: "Initial stock creation",
        createdBy,
        changeType: initialQuantity > 0 ? "INCREASE" : "ADJUSTMENT",
        journalType: initialQuantity > 0 ? "PURCHASE" : "ADJUSTMENT",
      },
    });

    return stock;
  });
}

export async function updateStockQuantity(stockId: string, delta: number, createdBy: string, allowNegative = false) {
  if (!createdBy) throw new Error("createdBy (userId) is required for audit");
  if (!stockId) throw new Error("stockId required");

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const stock = await tx.stock.findUnique({ where: { id: stockId } });
      if (!stock) throw new Error("Stock not found");

      const newQty = stock.quantity + delta;
      if (!allowNegative && newQty < 0) throw new Error("Insufficient stock");

      const updatedCount = await tx.stock.updateMany({
        where: { id: stockId, quantity: stock.quantity },
        data: { quantity: newQty },
      });

      if (updatedCount.count === 0) {
        // concurrent modification, ask outer loop to retry
        return null;
      }

      await tx.stockHistory.create({
        data: {
          stockId,
          quantityOld: stock.quantity,
          quantityDiff: delta,
          quantityNew: newQty,
          note: delta > 0 ? "Stock increase" : delta < 0 ? "Stock decrease" : "Stock adjustment",
          createdBy,
          changeType: delta > 0 ? "INCREASE" : delta < 0 ? "DECREASE" : "ADJUSTMENT",
          journalType: delta > 0 ? "PURCHASE" : delta < 0 ? "SALE" : "ADJUSTMENT",
        },
      });

      return tx.stock.findUnique({ where: { id: stockId } });
    });

    if (result === null) {
      // small backoff then retry
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 50));
      continue;
    }

    return result;
  }

  throw new Error("Could not update stock due to concurrent modifications. Try again.");
}

export async function setStockAbsolute(stockId: string, absoluteQty: number, createdBy: string) {
  if (!createdBy) throw new Error("createdBy (userId) is required for audit");
  if (!stockId) throw new Error("stockId required");

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const stock = await tx.stock.findUnique({ where: { id: stockId } });
    if (!stock) throw new Error("Stock not found");

    const old = stock.quantity;
    const diff = absoluteQty - old;

    const updated = await tx.stock.update({ where: { id: stockId }, data: { quantity: absoluteQty } });

    await tx.stockHistory.create({
      data: {
        stockId,
        quantityOld: old,
        quantityDiff: diff,
        quantityNew: absoluteQty,
        note: "Absolute stock set",
        createdBy,
        changeType: diff > 0 ? "INCREASE" : diff < 0 ? "DECREASE" : "ADJUSTMENT",
        journalType: "ADJUSTMENT",
      },
    });

    return updated;
  });
}

export async function createOrUpdateStock(productId: string, storeId: string, qtyToSet: number, createdBy: string) {
  if (!createdBy) throw new Error("createdBy (userId) is required for audit");

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.stock.findUnique({ where: { productId_storeId: { productId, storeId } } });

    if (!existing) {
      const stock = await tx.stock.create({ data: { productId, storeId, quantity: qtyToSet } });
      await tx.stockHistory.create({
        data: {
          stockId: stock.id,
          quantityOld: 0,
          quantityDiff: stock.quantity,
          quantityNew: stock.quantity,
          note: "Create stock via createOrUpdate",
          createdBy,
          changeType: qtyToSet > 0 ? "INCREASE" : "ADJUSTMENT",
          journalType: qtyToSet > 0 ? "PURCHASE" : "ADJUSTMENT",
        },
      });
      return stock;
    } else {
      const old = existing.quantity;
      if (old === qtyToSet) return existing;
      const updated = await tx.stock.update({ where: { id: existing.id }, data: { quantity: qtyToSet } });
      await tx.stockHistory.create({
        data: {
          stockId: existing.id,
          quantityOld: old,
          quantityDiff: qtyToSet - old,
          quantityNew: qtyToSet,
          note: "Update stock via createOrUpdate",
          createdBy,
          changeType: qtyToSet > old ? "INCREASE" : "DECREASE",
          journalType: "ADJUSTMENT",
        },
      });
      return updated;
    }
  });
}

export async function transferStockBetweenStores(productId: string, fromStoreId: string, toStoreId: string, qty: number, performedBy: string) {
  if (!performedBy) throw new Error("performedBy (userId) is required for audit");
  if (fromStoreId === toStoreId) throw new Error("fromStoreId and toStoreId must be different");
  if (qty <= 0) throw new Error("quantity must be positive");

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const source = await tx.stock.findUnique({ where: { productId_storeId: { productId, storeId: fromStoreId } } });
    if (!source) throw new Error("Source stock not found");
    if (source.quantity < qty) throw new Error("Insufficient source stock");

    const dest = await tx.stock.findUnique({ where: { productId_storeId: { productId, storeId: toStoreId } } });

    // deduct from source
    const sourceNew = source.quantity - qty;
    await tx.stock.update({ where: { id: source.id }, data: { quantity: sourceNew } });
    await tx.stockHistory.create({
      data: {
        stockId: source.id,
        quantityOld: source.quantity,
        quantityDiff: -qty,
        quantityNew: sourceNew,
        note: `Transfer out to store ${toStoreId}`,
        createdBy: performedBy,
        changeType: "DECREASE",
        journalType: "TRANSFER",
      },
    });

    // add to destination (create if missing)
    if (!dest) {
      const created = await tx.stock.create({ data: { productId, storeId: toStoreId, quantity: qty } });
      await tx.stockHistory.create({
        data: {
          stockId: created.id,
          quantityOld: 0,
          quantityDiff: qty,
          quantityNew: qty,
          note: `Transfer in from store ${fromStoreId}`,
          createdBy: performedBy,
          changeType: "INCREASE",
          journalType: "TRANSFER",
        },
      });

      const updatedSource = await tx.stock.findUnique({ where: { id: source.id } });
      return { from: updatedSource, to: created };
    } else {
      const destNew = dest.quantity + qty;
      await tx.stock.update({ where: { id: dest.id }, data: { quantity: destNew } });
      await tx.stockHistory.create({
        data: {
          stockId: dest.id,
          quantityOld: dest.quantity,
          quantityDiff: qty,
          quantityNew: destNew,
          note: `Transfer in from store ${fromStoreId}`,
          createdBy: performedBy,
          changeType: "INCREASE",
          journalType: "TRANSFER",
        },
      });

      const updatedSource = await tx.stock.findUnique({ where: { id: source.id } });
      const updatedDest = await tx.stock.findUnique({ where: { id: dest.id } });
      return { from: updatedSource, to: updatedDest };
    }
  });
}

export async function getStockById(stockId: string) {
  return prisma.stock.findUnique({
    where: { id: stockId },
    include: {
      product: true,
      store: true,
      histories: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getStockByProductAndStore(productId: string, storeId: string) {
  return prisma.stock.findUnique({ where: { productId_storeId: { productId, storeId } } });
}

export async function listStockByStore(storeId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [total, items] = await prisma.$transaction([
    prisma.stock.count({ where: { storeId } }),
    prisma.stock.findMany({
      where: { storeId },
      take: limit,
      skip,
      include: { product: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const mapped = items.map((it) => ({
    stockId: it.id,            
    productId: it.productId,
    productName: it.product?.name ?? null,
    quantity: it.quantity,
    updatedAt: it.updatedAt,
  }));

  return paginateResponse(mapped, total, page, limit);
}

export const getProductStocks = async (
  productId: string,
  authUser: { sub: string; role: string; stores?: string[] },
  page = 1,
  limit = 20
) => {
  const p = Math.max(1, page);
  const l = Math.min(100, limit);
  const skip = (p - 1) * l;

  let whereClause: Prisma.StockWhereInput = { productId };

  if (authUser.role === "ADMIN_STORE") {
    whereClause = {
      ...whereClause,
      storeId: { in: authUser.stores ?? [] },
    };
  }

  const [total, items] = await prisma.$transaction([
    prisma.stock.count({ where: whereClause }),
    prisma.stock.findMany({
      where: whereClause,
      skip,
      take: l,
      include: { store: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const mapped = items.map((it) => ({
    stockId: it.id,            // <-- tambahkan id di sini
    storeId: it.storeId,
    storeName: it.store?.name ?? null,
    quantity: it.quantity,
    updatedAt: it.updatedAt,
  }));

  return paginateResponse(mapped, total, p, l);
};