import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

interface ReportParams {
  role?: string;
  userStoreId?: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  categoryId?: string;
  lowStockThreshold?: number;
  limit?: number;
  page?: number;
}

// Helper default pagination
const parsePagination = ({ limit = 20, page = 1 }: { limit?: number; page?: number }) => {
  const _limit = Math.min(limit, 100);
  const _page = Math.max(page, 1);
  return { take: _limit, skip: (_page - 1) * _limit };
};

// ===================== SALES REPORT =====================
export const getSalesReport = async ({
  role,
  userStoreId,
  startDate,
  endDate,
  storeId,
}: ReportParams) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate) : new Date();

  let storeFilter: string | undefined;
  if (role === "STORE_ADMIN") storeFilter = userStoreId;
  else if (role === "SUPER_ADMIN" && storeId) storeFilter = storeId;

  const summary = await prisma.order.aggregate({
    _sum: { finalPrice: true, discountTotal: true },
    _count: { id: true },
    _avg: { finalPrice: true },
    where: {
      status: { in: ["DELIVERED", "ORDER_CONFIRMATION"] },
      createdAt: { gte: start, lte: end },
      ...(storeFilter ? { storeId: storeFilter } : {}),
    },
  });

  const salesPerMonth = await prisma.order.groupBy({
    by: ["createdAt"],
    _sum: { finalPrice: true },
    _count: { id: true },
    where: {
      status: { in: ["DELIVERED", "ORDER_CONFIRMATION"] },
      createdAt: { gte: start, lte: end },
      ...(storeFilter ? { storeId: storeFilter } : {}),
    },
  });

  const monthlySales = salesPerMonth.map((item) => ({
    month: item.createdAt.getMonth() + 1,
    year: item.createdAt.getFullYear(),
    totalRevenue: item._sum.finalPrice || 0,
    totalOrders: item._count.id,
  }));

  // sales by product with pagination
  const { take, skip } = parsePagination({ limit: 20, page: 1 });
  const salesByProduct = await prisma.$queryRaw<{
    productId: string;
    name: string;
    categoryId: string;
    totalQty: number;
    totalRevenue: number;
  }[]>`
    SELECT p.id as "productId",
           p.name,
           p."categoryId",
           SUM(oi.quantity) as "totalQty",
           SUM(oi."subTotal") as "totalRevenue"
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    JOIN "Product" p ON oi."productId" = p.id
    WHERE o.status IN ('DELIVERED', 'ORDER_CONFIRMATION')
      AND o."createdAt" BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      ${storeFilter ? `AND o."storeId" = '${storeFilter}'` : ''}
    GROUP BY p.id
    ORDER BY totalRevenue DESC
    LIMIT ${take} OFFSET ${skip}
  `;

  const salesByCategory = await prisma.$queryRaw<{
    categoryId: string;
    totalRevenue: number;
    totalQty: number;
  }[]>`
    SELECT p."categoryId",
           SUM(oi."subTotal") as "totalRevenue",
           SUM(oi."quantity") as "totalQty"
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    JOIN "Product" p ON oi."productId" = p.id
    WHERE o.status IN ('DELIVERED', 'ORDER_CONFIRMATION')
      AND o."createdAt" BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      ${storeFilter ? `AND o."storeId" = '${storeFilter}'` : ''}
    GROUP BY p."categoryId"
    ORDER BY totalRevenue DESC
    LIMIT ${take} OFFSET ${skip}
  `;

  return {
    period: { start, end },
    summary: {
      totalRevenue: summary._sum.finalPrice || 0,
      totalDiscount: summary._sum.discountTotal || 0,
      totalOrders: summary._count.id || 0,
      avgOrderValue: summary._avg.finalPrice || 0,
    },
    monthlySales,
    salesByProduct,
    salesByCategory,
  };
};

// ===================== STOCK REPORT =====================
export const getStockReport = async ({
  role,
  userStoreId,
  startDate,
  endDate,
  storeId,
  categoryId,
  lowStockThreshold = 10,
  limit = 20,
  page = 1,
}: ReportParams) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate) : new Date();

  let storeFilter: string | undefined;
  if (role === "STORE_ADMIN") storeFilter = userStoreId;
  else if (role === "SUPER_ADMIN" && storeId) storeFilter = storeId;

  const { take, skip } = parsePagination({ limit, page });

  // Current stock
  const currentStockRaw = await prisma.stock.findMany({
    where: storeFilter ? { storeId: storeFilter } : {},
    include: { product: true, store: true },
    skip,
    take,
  });

  const currentStock = currentStockRaw
    .filter((item) => !categoryId || item.product?.categoryId === categoryId)
    .map((item) => ({
      productId: item.productId,
      productName: item.product?.name || "Unknown",
      categoryId: item.product?.categoryId || null,
      storeId: item.storeId,
      storeName: item.store?.name || "Unknown",
      totalStock: item.quantity,
    }));

  // Stock Movement
  const stockMovementRaw = await prisma.stockHistory.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      ...(storeFilter ? { storeId: storeFilter } : {}),
    },
    skip,
    take,
  });

  // fetch related stocks
  const stockIds = stockMovementRaw.map((s) => s.stockId);
  const stocks = await prisma.stock.findMany({
    where: { id: { in: stockIds } },
    include: { product: true, store: true },
  });

  const stockMovement = stockMovementRaw.map((item) => {
    const stock = stocks.find((s) => s.id === item.stockId);
    return {
      productId: stock?.productId,
      productName: stock?.product?.name || "Unknown",
      categoryId: stock?.product?.categoryId || null,
      storeId: stock?.storeId,
      storeName: stock?.store?.name || "Unknown",
      netMovement: item.quantityChange,
      createdAt: item.createdAt,
      changeType: item.changeType,
    };
  });

  // Low Stock
  const lowStock = currentStock.filter((i) => i.totalStock <= lowStockThreshold);

  const totalStockIn = stockMovement.filter((m) => m.netMovement > 0).reduce((sum, m) => sum + m.netMovement, 0);
  const totalStockOut = stockMovement.filter((m) => m.netMovement < 0).reduce((sum, m) => sum + Math.abs(m.netMovement), 0);
  const totalCurrentStock = currentStock.map((i) => i.totalStock).reduce((sum, v) => sum + v, 0);

  return { period: { start, end }, summary: { totalStockIn, totalStockOut, totalCurrentStock }, currentStock, stockMovement, lowStock };
};

// ===================== DISCOUNT REPORT =====================
export const getDiscountReport = async ({
  role,
  userStoreId,
  startDate,
  endDate,
  storeId,
  categoryId,
  limit = 20,
  page = 1,
}: ReportParams) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate) : new Date();

  let storeFilter: string | undefined;
  if (role === "STORE_ADMIN") storeFilter = userStoreId;
  else if (role === "SUPER_ADMIN" && storeId) storeFilter = storeId;

  const { take, skip } = parsePagination({ limit, page });

  const summary = await prisma.order.aggregate({
    _sum: { discountTotal: true },
    _count: { id: true },
    where: { status: { in: ["DELIVERED", "ORDER_CONFIRMATION"] }, createdAt: { gte: start, lte: end }, ...(storeFilter ? { storeId: storeFilter } : {}) },
  });

  const discountByProduct = await prisma.$queryRaw<{
    productId: string;
    name: string;
    categoryId: string;
    totalDiscount: number;
    totalRevenue: number;
  }[]>`
    SELECT p.id as "productId", p.name, p."categoryId",
           SUM(oi."discount") as "totalDiscount",
           SUM(oi."subTotal") as "totalRevenue"
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    JOIN "Product" p ON oi."productId" = p.id
    WHERE o.status IN ('DELIVERED','ORDER_CONFIRMATION')
      AND o."createdAt" BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      ${storeFilter ? `AND o."storeId" = '${storeFilter}'` : ''}
      ${categoryId ? `AND p."categoryId" = '${categoryId}'` : ''}
    GROUP BY p.id
    ORDER BY totalDiscount DESC
    LIMIT ${take} OFFSET ${skip}
  `;

  const discountByCategory = await prisma.$queryRaw<{
    categoryId: string;
    totalDiscount: number;
    totalRevenue: number;
  }[]>`
    SELECT p."categoryId",
           SUM(oi."discount") as "totalDiscount",
           SUM(oi."subTotal") as "totalRevenue"
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    JOIN "Product" p ON oi."productId" = p.id
    WHERE o.status IN ('DELIVERED','ORDER_CONFIRMATION')
      AND o."createdAt" BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      ${storeFilter ? `AND o."storeId" = '${storeFilter}'` : ''}
      ${categoryId ? `AND p."categoryId" = '${categoryId}'` : ''}
    GROUP BY p."categoryId"
    ORDER BY totalDiscount DESC
    LIMIT ${take} OFFSET ${skip}
  `;

  return { period: { start, end }, summary: { totalDiscount: summary._sum.discountTotal || 0, totalOrders: summary._count.id || 0 }, discountByProduct, discountByCategory };
};

// ===================== CUSTOMER BEHAVIOR REPORT =====================
export const getCustomerBehaviorReport = async ({
  role,
  userStoreId,
  startDate,
  endDate,
  storeId,
  limit = 20,
  page = 1,
}: ReportParams) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate) : new Date();

  let storeFilter: string | undefined;
  if (role === "STORE_ADMIN") storeFilter = userStoreId;
  else if (role === "SUPER_ADMIN" && storeId) storeFilter = storeId;

  const { take, skip } = parsePagination({ limit, page });

  const customerData = await prisma.order.groupBy({
  by: ["userId"],
  _count: { id: true },
  _sum: { finalPrice: true },
  _avg: { finalPrice: true },
  where: { 
    status: { in: ["DELIVERED","ORDER_CONFIRMATION"] }, 
    createdAt: { gte: start, lte: end }, 
    ...(storeFilter ? { storeId: storeFilter } : {}) 
  },
  skip,
  take,
  orderBy: { _sum: { finalPrice: "desc" } },
});


  const customerBehavior = customerData.map((c) => ({
    customerId: c.userId,
    totalOrders: c._count.id,
    totalSpent: c._sum.finalPrice || 0,
    avgOrderValue: c._avg.finalPrice || 0,
    segment: c._count.id >= 5 ? "Loyal" : c._count.id >= 2 ? "Frequent" : "New",
  }));

  return { period: { start, end }, customerBehavior };
};
