// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '12', 10);

async function main() {
  console.log('Start seeding...');

  // Users
  const superPass = await bcrypt.hash('SuperPass123!', SALT_ROUNDS);
  const storePass = await bcrypt.hash('StorePass123!', SALT_ROUNDS);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@admin.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      fullName: 'Super Admin',
      dateOfBirth: new Date('1990-01-01'),
      email: 'super@admin.test',
      password: superPass,
      phoneNumber: '081100000001',
      photoProfile: '',
      verified: true,
      user_role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    },
  });

  const storeAdmin1 = await prisma.user.upsert({
    where: { email: 'store1@admin.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      fullName: 'Store Admin 1',
      dateOfBirth: new Date('1995-05-05'),
      email: 'store1@admin.test',
      password: storePass,
      phoneNumber: '081100000011',
      photoProfile: '',
      verified: true,
      user_role: 'ADMIN_STORE',
      status: 'ACTIVE'
    },
  });

  // Stores
  const storeA = await prisma.store.upsert({
    where: { id: 'store-000-1' },
    update: {},
    create: {
      id: 'store-000-1',
      name: 'Ponorogo Fresh Market',
      logo: '',
      description: 'Toko bahan makanan segar di Ponorogo',
      status: 'ACTIVE',
      city: 'Ponorogo',
      province: 'Jawa Timur',
      subdistrict: 'Kotakulon',
      address: 'Jl. Contoh No.1',
      latitude: new prisma.Decimal( -7.87 ), // gunakan Decimal import jika perlu
      longitude: new prisma.Decimal(111.47),
    }
  });

  const storeB = await prisma.store.upsert({
    where: { id: 'store-000-2' },
    update: {},
    create: {
      id: 'store-000-2',
      name: 'Kedai Segar',
      logo: '',
      description: 'Toko sayuran segar',
      status: 'ACTIVE',
      city: 'Ponorogo',
      province: 'Jawa Timur',
      subdistrict: 'Bendungan',
      address: 'Jl. Contoh No.2',
      latitude: new prisma.Decimal(-7.88),
      longitude: new prisma.Decimal(111.48),
    }
  });

  // Link store admin to store (UserStore)
  await prisma.userStore.upsert({
    where: {
      userId_storeId: {
        userId: storeAdmin1.id,
        storeId: storeA.id,
      }
    },
    update: {},
    create: {
      userId: storeAdmin1.id,
      storeId: storeA.id,
    }
  });

  // Categories
  const catVeg = await prisma.category.upsert({ where: { name: 'Sayuran' }, update: {}, create: { name: 'Sayuran' }});
  const catFruits = await prisma.category.upsert({ where: { name: 'Buah' }, update: {}, create: { name: 'Buah' }});
  const catSpice = await prisma.category.upsert({ where: { name: 'Bumbu' }, update: {}, create: { name: 'Bumbu' }});

  // Products (global)
  const pBayam = await prisma.product.upsert({
    where: { name: 'Bayam Segar' },
    update: {},
    create: {
      id: 'prod-000-1',
      name: 'Bayam Segar',
      sku: 'VG-001',
      description: 'Bayam lokal, segar',
      price: 8000,
      isActive: true,
      categoryId: catVeg.id,
    }
  });

  const pApel = await prisma.product.upsert({
    where: { name: 'Apel Malang' },
    update: {},
    create: {
      id: 'prod-000-2',
      name: 'Apel Malang',
      sku: 'FR-001',
      description: 'Apel manis Malang',
      price: 15000,
      isActive: true,
      categoryId: catFruits.id,
    }
  });

  const pBawang = await prisma.product.upsert({
    where: { name: 'Bawang Merah' },
    update: {},
    create: {
      id: 'prod-000-3',
      name: 'Bawang Merah',
      sku: 'SP-001',
      description: 'Bawang merah lokal',
      price: 12000,
      isActive: true,
      categoryId: catSpice.id,
    }
  });

  // Product images (multiple)
  await prisma.productImage.createMany({
    data: [
      { id: 'img-1', productId: pBayam.id, url: '/uploads/bayam-1.jpg', altText: 'Bayam 1', isPrimary: true },
      { id: 'img-2', productId: pBayam.id, url: '/uploads/bayam-2.jpg', altText: 'Bayam 2', isPrimary: false },
      { id: 'img-3', productId: pApel.id, url: '/uploads/apel-1.jpg', altText: 'Apel 1', isPrimary: true },
      { id: 'img-4', productId: pBawang.id, url: '/uploads/bawang-1.jpg', altText: 'Bawang 1', isPrimary: true },
    ]
  });

  // Stocks per store
  await prisma.stock.upsert({
    where: { productId_storeId: { productId: pBayam.id, storeId: storeA.id } },
    update: {},
    create: { id: 'stock-1', productId: pBayam.id, storeId: storeA.id, quantity: 50 }
  });

  await prisma.stock.upsert({
    where: { productId_storeId: { productId: pBayam.id, storeId: storeB.id } },
    update: {},
    create: { id: 'stock-2', productId: pBayam.id, storeId: storeB.id, quantity: 0 } // out of stock at store B
  });

  await prisma.stock.upsert({
    where: { productId_storeId: { productId: pApel.id, storeId: storeA.id } },
    update: {},
    create: { id: 'stock-3', productId: pApel.id, storeId: storeA.id, quantity: 20 }
  });

  // Stock journal (initial stock entries)
  await prisma.stockJournal.createMany({
    data: [
      { id: 'sj-1', stockId: 'stock-1', changeType: 'INCREASE', quantityOld: 0, quantityDiff: 50, quantityNew: 50, reason: 'Initial stock', createdBy: superAdmin.id },
      { id: 'sj-2', stockId: 'stock-2', changeType: 'INCREASE', quantityOld: 0, quantityDiff: 0, quantityNew: 0, reason: 'Initial stock (none)', createdBy: superAdmin.id },
      { id: 'sj-3', stockId: 'stock-3', changeType: 'INCREASE', quantityOld: 0, quantityDiff: 20, quantityNew: 20, reason: 'Initial stock', createdBy: superAdmin.id },
    ]
  });

  // Discounts
  const discManual = await prisma.discount.create({
    data: {
      id: 'disc-1',
      code: 'MANUAL10',
      name: 'Diskon 10% Manual',
      discountType: 'MANUAL',
      isPercentage: true,
      value: 10,
      isActive: true,
    }
  });

  const discMinSpend = await prisma.discount.create({
    data: {
      id: 'disc-2',
      code: 'SAVE20K',
      name: 'Diskon Rp20.000 untuk belanja >= 200.000',
      discountType: 'MIN_SPEND',
      isPercentage: false,
      value: 20000,
      minSpend: 200000,
      isActive: true,
    }
  });

  const discBuyXGetY = await prisma.discount.create({
    data: {
      id: 'disc-3',
      code: 'B1G1-BAYAM',
      name: 'Beli 1 Bayam Gratis 1',
      discountType: 'BUY_X_GET_Y',
      isPercentage: false,
      value: 0,
      buyQuantity: 1,
      freeQuantity: 1,
      isActive: true,
    }
  });

  // Associate discounts to products (ProductDiscount)
  await prisma.productDiscount.createMany({
    data: [
      { id: 'pd-1', productId: pBayam.id, discountId: discManual.id },
      { id: 'pd-2', productId: pBayam.id, discountId: discBuyXGetY.id },
      { id: 'pd-3', productId: pApel.id, discountId: discMinSpend.id },
    ]
  });

  // Create sample orders (for sales report)
  const order1 = await prisma.order.create({
    data: {
      id: 'order-000-1',
      userId: superAdmin.id,
      totalPrice: 16000,
      discount: 0,
      finalPrice: 16000,
      status: 'DELIVERED',
      paymentProof: '',
      OrderItems: {
        create: [
          { id: 'oi-1', productId: pBayam.id, quantity: 2, price: 8000, subTotal: 16000 }
        ]
      }
    },
    include: { OrderItems: true }
  });

  console.log('Seeding done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
