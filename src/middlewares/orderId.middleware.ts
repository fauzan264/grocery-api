import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateOrderCode() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${y}${m}${d}-${rand}`;
}


prisma.$use(async (params, next) => {
  if (params.model === "Order" && params.action === "create") {
    if (!params.args.data.orderCode) {
      let code;
      let exists;
      do {
        code = generateOrderCode();
        exists = await prisma.order.findUnique({ where: { orderCode: code } });
      } while (exists);
      params.args.data.orderCode = code;
    }
  }
  return next(params);
});

export default prisma;
