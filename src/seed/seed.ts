// src/seed/seed.ts
import { PrismaClient } from '../generated/prisma';
import slugify from 'slugify';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

function makeSlug(name: string, fallbackId: string) {
  if (!name || name.trim() === '') return `category-${fallbackId.slice(0, 8)}`;
  // slugify options: lower-case, strip special chars
  return slugify(name, { lower: true, strict: true });
}

// optional: fungsi untuk memastikan slug unik dengan loop (simple)
async function ensureUniqueCategorySlug(base: string, id: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  // loop sampai tidak ada conflict atau conflict only with same id
  while (true) {
    const found = await prisma.category.findFirst({ where: { slug } });
    if (!found || found.id === id) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

async function upsertCategories() {
  const categories = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Uncategorized',
      description: 'Kategori default bila produk belum punya kategori',
      parentId: null as string | null,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Cookware',
      description: 'Peralatan memasak utama: panci, wajan, dutch oven.',
      parentId: null,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Panci',
      description: 'Berbagai jenis panci untuk memasak sehari-hari.',
      parentId: '22222222-2222-2222-2222-222222222222',
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Wajan',
      description: 'Wajan anti lengket dan besi untuk berbagai masakan.',
      parentId: '22222222-2222-2222-2222-222222222222',
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Utensils',
      description: 'Alat-alat kecil seperti spatula, sendok, pengupas.',
      parentId: null,
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Blender & Small Appliances',
      description: 'Blender, food processor, dan peralatan listrik kecil lain.',
      parentId: null,
    },
  ];

  for (const c of categories) {
    // buat base slug dari name (fallback ke id)
    const base = makeSlug(c.name, c.id);
    const finalSlug = await ensureUniqueCategorySlug(base, c.id);

    const data = {
      id: c.id,
      name: c.name,
      slug: finalSlug,
      description: c.description,
      parentId: c.parentId,
      isActive: true,
      deletedAt: null,
      createdBy: null,
    };

    await prisma.category.upsert({
      where: { name: c.name }, // name unique menurut schema
      update: data,
      create: data,
    });

    console.log(`Upserted category: ${c.name} (slug: ${finalSlug})`);
  }
}

async function upsertProducts() {
  const products = [
    {
      name: 'Panci Stainless 24cm',
      sku: 'PAN-SS-24',
      description: 'Panci stainless steel 304 ukuran 24cm, cocok untuk tumis & rebus.',
      price: 250000,
      categoryId: '33333333-3333-3333-3333-333333333333',
      weight_g: 1200,
    },
    {
      name: 'Wajan Anti Lengket 28cm',
      sku: 'WJN-NL-28',
      description: 'Wajan lapisan non-stick, cocok untuk menggoreng tanpa lengket.',
      price: 180000,
      categoryId: '44444444-4444-4444-4444-444444444444',
      weight_g: 800,
    },
    {
      name: 'Spatula Silikon Set',
      sku: 'UTL-SPT-SET',
      description: 'Set spatula silikon tahan panas, 3 pcs.',
      price: 75000,
      categoryId: '55555555-5555-5555-5555-555555555555',
      weight_g: 200,
    },
    {
      name: 'Blender Portable 600W',
      sku: 'BLD-600W',
      description: 'Blender portable 600W, cocok untuk smoothie & jus.',
      price: 350000,
      categoryId: '66666666-6666-6666-6666-666666666666',
      weight_g: 1800,
    },
    {
      name: 'Panci Presto 6L',
      sku: 'PRESTO-6L',
      description: 'Pressure cooker 6 liter, hemat gas & cepat empuk.',
      price: 420000,
      categoryId: '33333333-3333-3333-3333-333333333333',
      weight_g: 3500,
    },
    {
      name: 'Set Alat Masak 10pcs',
      sku: 'SET-10PCS',
      description: 'Paket lengkap alat masak dasar 10pcs, cocok untuk starter kit.',
      price: 200000,
      categoryId: '55555555-5555-5555-5555-555555555555',
      weight_g: 1500,
    },
  ];

  for (const p of products) {
    const data = {
      name: p.name,
      sku: p.sku,
      description: p.description,
      price: p.price,
      isActive: true,
      categoryId: p.categoryId,
      weight_g: p.weight_g,
      deletedAt: null,
    };

    await prisma.product.upsert({
      where: { name: p.name }, // unique on name in schema
      create: data,
      update: data,
    });

    console.log(`Upserted product: ${p.name}`);
  }
}

async function main() {
  console.log('Running seed (TypeScript) ...');
  await upsertCategories();
  await upsertProducts();
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
