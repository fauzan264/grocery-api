// src/seed/seed.ts
import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../db/connection";

async function main() {
  // ===== 1. Kategori =====
  const category = await prisma.category.upsert({
    where: { name: "Minuman" },
    update: {},
    create: {
      name: "Minuman",
      slug: "minuman",
    },
  });
  console.log("Kategori:", category.name);

  // ===== 2. Produk =====
  const productsData = [
    { name: "Air Mineral", price: 5000 },
    { name: "Teh Botol", price: 8000 },
    { name: "Kopi Sachet", price: 12000 },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { name: p.name },
      update: {},
      create: {
        name: p.name,
        price: p.price,
        categoryId: category.id,
      },
    });
    createdProducts.push(product);
    console.log("Produk dibuat:", product.name);
  }

  // ===== 3. Stock =====
  const storeId = "c47f42fb-4620-4eb4-bf4e-8136610eff71"; // ganti sesuai store
  for (const product of createdProducts) {
    await prisma.stock.upsert({
      where: {
        productId_storeId: {
          productId: product.id,
          storeId,
        },
      },
      update: {},
      create: {
        productId: product.id,
        storeId,
        quantity: 100, // stock awal
      },
    });
    console.log(`Stock dibuat untuk ${product.name} di store ${storeId}`);
  }

  console.log("Seeding kategori, produk, dan stock selesai ✅");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
