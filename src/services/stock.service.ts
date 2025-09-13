import prisma from "../prisma/client";
import { paginateResponse } from "../utils/pagination";

const MAX_RETRY = 3;


export async function createStockForStore(productId: string, storeId: string, initialQuantity = 0, createdBy: string) {
if (!createdBy) throw new Error("createdBy (userId) is required for audit");


return await prisma.$transaction(async (tx: any) => {
const existing = await tx.stock.findUnique({
where: { productId_storeId: { productId, storeId } }
}).catch(() => null);


if (existing) throw new Error("Stock already exists for this product and store");


const stock = await tx.stock.create({ data: { productId, storeId, quantity: initialQuantity } });


await tx.stockHistory.create({
data: {
stockId: stock.id,
changeType: initialQuantity > 0 ? "INCREASE" : "ADJUSTMENT",
journalType: initialQuantity > 0 ? "PURCHASE" : "ADJUSTMENT",
oldQuantity: 0,
quantityChange: stock.quantity,
newQuantity: stock.quantity,
userId: createdBy,
},
});


return stock;
});
}

export async function updateStockQuantity(stockId: string, delta: number, createdBy: string, allowNegative = false) {
if (!createdBy) throw new Error("createdBy (userId) is required for audit");


for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
const result = await prisma.$transaction(async (tx: any) => {
const stock = await tx.stock.findUnique({ where: { id: stockId } });
if (!stock) throw new Error("Stock not found");


const newQty = stock.quantity + delta;
if (!allowNegative && newQty < 0) throw new Error("Insufficient stock");


const updatedCount = await tx.stock.updateMany({
where: { id: stockId, quantity: stock.quantity },
data: { quantity: newQty },
});


if (updatedCount.count === 0) {
// concurrent modification, ask for retry
return null;
}


await tx.stockHistory.create({
data: {
stockId: stockId,
changeType: delta > 0 ? "INCREASE" : delta < 0 ? "DECREASE" : "ADJUSTMENT",
journalType: delta > 0 ? "PURCHASE" : delta < 0 ? "SALE" : "ADJUSTMENT",
oldQuantity: stock.quantity,
quantityChange: delta,
newQuantity: newQty,
userId: createdBy,
},
});
return tx.stock.findUnique({ where: { id: stockId } });
});


if (result === null) {
// small backoff then retry
await new Promise((r) => setTimeout(r, 50 + Math.random() * 30));
continue;
}


return result;
}


throw new Error("Could not update stock due to concurrent modifications. Try again.");
}

export async function setStockAbsolute(stockId: string, absoluteQty: number, createdBy: string) {
if (!createdBy) throw new Error("createdBy (userId) is required for audit");


return await prisma.$transaction(async (tx: any) => {
const stock = await tx.stock.findUnique({ where: { id: stockId } });
if (!stock) throw new Error("Stock not found");


const old = stock.quantity;
const diff = absoluteQty - old;


const updated = await tx.stock.update({ where: { id: stockId }, data: { quantity: absoluteQty } });


await tx.stockHistory.create({
data: {
stockId,
changeType: diff > 0 ? "INCREASE" : diff < 0 ? "DECREASE" : "ADJUSTMENT",
journalType: "ADJUSTMENT",
oldQuantity: old,
quantityChange: diff,
newQuantity: absoluteQty,
userId: createdBy,
},
});


return updated;
});
}

export async function createOrUpdateStock(productId: string, storeId: string, qtyToSet: number, createdBy: string) {
if (!createdBy) throw new Error("createdBy (userId) is required for audit");


return await prisma.$transaction(async (tx: any) => {
const existing = await tx.stock.findUnique({ where: { productId_storeId: { productId, storeId } } });


if (!existing) {
const stock = await tx.stock.create({ data: { productId, storeId, quantity: qtyToSet } });
await tx.stockHistory.create({
data: {
stockId: stock.id,
changeType: qtyToSet > 0 ? "INCREASE" : "ADJUSTMENT",
journalType: qtyToSet > 0 ? "PURCHASE" : "ADJUSTMENT",
oldQuantity: 0,
quantityChange: stock.quantity,
newQuantity: stock.quantity,
userId: createdBy,
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
changeType: qtyToSet > old ? "INCREASE" : "DECREASE",
journalType: "ADJUSTMENT",
oldQuantity: old,
quantityChange: qtyToSet - old,
newQuantity: qtyToSet,
userId: createdBy,
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


return await prisma.$transaction(async (tx: any) => {
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
changeType: "DECREASE",
journalType: "TRANSFER",
oldQuantity: source.quantity,
quantityChange: -qty,
newQuantity: sourceNew,
userId: performedBy,
},
});

// add to destination (create if missing)
if (!dest) {
const created = await tx.stock.create({ data: { productId, storeId: toStoreId, quantity: qty } });
await tx.stockHistory.create({
data: {
stockId: created.id,
changeType: "INCREASE",
journalType: "TRANSFER",
oldQuantity: 0,
quantityChange: qty,
newQuantity: qty,
userId: performedBy,
},
});
return { from: { ...source, quantity: sourceNew }, to: created };
} else {
const destNew = dest.quantity + qty;
await tx.stock.update({ where: { id: dest.id }, data: { quantity: destNew } });
await tx.stockHistory.create({
data: {
stockId: dest.id,
changeType: "INCREASE",
journalType: "TRANSFER",
oldQuantity: dest.quantity,
quantityChange: qty,
newQuantity: destNew,
userId: performedBy,
},
});

const updatedSource = await tx.stock.findUnique({ where: { id: source.id } });
const updatedDest = await tx.stock.findUnique({ where: { id: dest.id } });
return { from: updatedSource, to: updatedDest };
}
});
}

export async function getStockById(stockId: string) {
return prisma.stock.findUnique({ where: { id: stockId }, include: { product: true, store: true } });
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
    productId: it.productId,
    productName: it.product.name,
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

  const whereClause: any = { productId };
  if (authUser.role === "ADMIN_STORE") {
    whereClause.storeId = { in: authUser.stores ?? [] };
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
    storeId: it.storeId,
    storeName: it.store.name,
    quantity: it.quantity,
    updatedAt: it.updatedAt,
  }));

  return paginateResponse(mapped, total, p, l);
};