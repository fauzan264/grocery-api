import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

interface ReportParams {
  role?: string;
  userStoreId?: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
}

export const getSalesReport = async ({
  role,
  userStoreId,
  startDate,
  endDate,
  storeId,
}: ReportParams) => {
  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate) : new Date();

  // 🔒 Store filter berdasarkan role
  let storeFilter: string | undefined;
  if (role === "STORE_ADMIN") {
    storeFilter = userStoreId;
  } else if (role === "SUPER_ADMIN" && storeId) {
    storeFilter = storeId;
  }

  // 📊 1. Ringkasan penjualan (summary)
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

  // 📈 2. Penjualan per bulan (trend chart)
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

  /// 🛒 3. Penjualan per produk
const salesByProduct = await prisma.orderItems.groupBy({
  by: ["productId"],
  _sum: { quantity: true, subTotal: true },
  _count: { id: true },
  where: {
    order: {
      status: { in: ["DELIVERED", "ORDER_CONFIRMATION"] },
      createdAt: { gte: start, lte: end },
      ...(storeFilter ? { storeId: storeFilter } : {}),
    },
  },
});


  // 📦 4. Penjualan per kategori
  const salesByCategory = await prisma.$queryRaw<
    { categoryId: string; totalRevenue: number; totalQty: number }[]
  >`
    SELECT p."categoryId", 
         SUM(oi."subTotal") as "totalRevenue",
         SUM(oi."quantity") as "totalQty"
  FROM "OrderItem" oi
  JOIN "Order" o ON oi."orderId" = o.id
  JOIN "Product" p ON oi."productId" = p.id
  WHERE o."status" IN ('DELIVERED', 'ORDER_CONFIRMATION')
    AND o."createdAt" BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'
    ${storeFilter ? `AND o."storeId" = '${storeFilter}'` : ''}
  GROUP BY p."categoryId"
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
