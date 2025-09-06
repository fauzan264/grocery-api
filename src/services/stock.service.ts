import prisma from "../prisma/client";


export async function createStockForStore(productId: string, storeId: string, initialQuantity = 0, createdBy?: string) {
return await prisma.$transaction(async (tx:any) => {
// check existing stock
const existing = await tx.stock.findUnique({ where: { productId_storeId: { productId, storeId } } }).catch(() => null);
if (existing) throw new Error("Stock already exists for this product and store");


const stock = await tx.stock.create({ data: { productId, storeId, quantity: initialQuantity } });


await tx.stockJournal.create({
data: {
stockId: stock.id,
changeType: initialQuantity > 0 ? "INCREASE" : "ADJUSTMENT",
journalType: initialQuantity > 0 ? "PURCHASE" : "ADJUSTMENT",
quantityOld: 0,
quantityDiff: stock.quantity,
quantityNew: stock.quantity,
reason: "Initial stock created",
createdBy: createdBy ?? null,
},
});


return stock;
});
}

export async function updateStockQuantity(stockId: string, delta: number, createdBy?: string, allowNegative = false) {
return await prisma.$transaction(async (tx:any) => {
const stock = await tx.stock.findUnique({ where: { id: stockId } });
if (!stock) throw new Error("Stock not found");


const newQty = stock.quantity + delta;
if (!allowNegative && newQty < 0) throw new Error("Insufficient stock");


const changeType = delta > 0 ? "INCREASE" : delta < 0 ? "DECREASE" : "ADJUSTMENT";
const journalType = delta > 0 ? "PURCHASE" : delta < 0 ? "SALE" : "ADJUSTMENT";


const updated = await tx.stock.update({ where: { id: stockId }, data: { quantity: newQty } });


await tx.stockJournal.create({
data: {
stockId: stockId,
changeType: changeType as any,
journalType: journalType as any,
quantityOld: stock.quantity,
quantityDiff: delta,
quantityNew: newQty,
reason: "Manual adjustment",
createdBy: createdBy ?? null,
},
});


return updated;
});
}