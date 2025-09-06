import { prisma } from "../db/connection";

async function main() {
  console.log("🌱 Starting seeding...");

  await prisma.category.createMany({
    data: [
      { id: "cat-1", name: "Fruits" },
      { id: "cat-2", name: "Vegetables" },
      { id: "cat-3", name: "Beverages" },
    ],
    skipDuplicates: true, // biar ga error kalau udah ada
  });

  console.log("✅ Categories seeded successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
