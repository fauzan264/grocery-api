// src/seed/seed.ts
import "dotenv/config";
import dotenv from "dotenv";
import { prisma } from "../db/connection";
import bcrypt from "bcrypt";

async function main() {
  const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

  // data SUPER_ADMIN default
  const superAdminData = {
  fullName: "Super Admin",
  email: "superadmin@example.com",
  phoneNumber: "+628123456789",
  userRole: "SUPER_ADMIN" as const,
  status: "ACTIVE" as const,
      verified: true,
  password: await bcrypt.hash("supersecret123", SALT_ROUNDS),
  dateOfBirth: new Date("2000-01-01"), // atau bisa new Date()
};


  // cek apakah super admin sudah ada
  const existing = await prisma.user.findFirst({
    where: { email: superAdminData.email, deletedAt: null },
  });

  if (existing) {
    console.log("SUPER_ADMIN sudah ada dengan email:", existing.email);
  } else {
    const created = await prisma.user.create({ data: superAdminData });
    console.log("SUPER_ADMIN berhasil dibuat:", created.email);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
  dotenv.config();

