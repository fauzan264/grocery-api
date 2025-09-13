import { prisma } from "../db/connection";
import { Prisma } from "../generated/prisma";
import { uploadBufferToCloudinarySimple as uploadBufferToCloudinary, destroyPublicId } from "../utils/cloudinary";

export interface CreateProductInput {
  name: string;
  description?: string;
  sku: string;
  initialStock?: number; // untuk create stock pada store tertentu
  storeId?: string | null; // untuk relasi ke toko saat initialStock diberikan
  price: number;
  categoryId: string;
  weight_g: number;
  initialQuantity?: number; // backward-compat, optional
  files?: Express.Multer.File[]; // files buffer jika ada
  user: {
    sub: string;
    role: "SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER";
    stores?: string[] | undefined;
  };
  images?: {
    url: string;
    publicId?: string;
    isPrimary?: boolean;
    altText?: string;
  }[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  initialStock?: number;
  storeId?: string | null;
  categoryId?: string;
  sku?: string | null;
  images?: {
    url: string;
    publicId?: string;
    isPrimary?: boolean;
    altText?: string;
  }[];
  // tambahan untuk operasi update yang melibatkan upload/hapus image
  files?: Express.Multer.File[];
  removeImageIds?: string[];
  primaryImageId?: string | null;
}

/**
 * Create product (with optional images upload and initial stock creation)
 */
export const createProduct = async (data: CreateProductInput) => {
  // validate unique name/sku using findUnique is OK karena di schema sudah unique
  const existingByName = await prisma.product.findUnique({ where: { name: data.name } });
  if (existingByName) throw { status: 409, message: "Product name already exists" };
  if (data.sku) {
    const existingBySku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingBySku) throw { status: 409, message: "SKU already exists" };
  }

  // upload files first (if any)
  const uploaded: { url: string; publicId: string }[] = [];
  if (data.files && data.files.length > 0) {
    try {
      for (const f of data.files) {
        // uploadBufferToCloudinary harus menerima buffer dan return { url, publicId }
        const up = await uploadBufferToCloudinary(f.buffer,
        );
        uploaded.push({ url: up.url, publicId: up.publicId });
      }
    } catch (err) {
      // jika gagal saat upload, bersihkan yang sudah terupload
      for (const u of uploaded) {
        try { await destroyPublicId(u.publicId); } catch (_) { /* log, ignore */ }
      }
      throw { status: 500, message: "Failed uploading images" };
    }
  }

  // Now perform DB transaction; if it fails, cleanup uploaded images
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          sku: data.sku || undefined,
          categoryId: data.categoryId || undefined,
          weight_g: data.weight_g || undefined,
        },
      });

      // create product images
      for (const [i, u] of uploaded.entries()) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: u.url,
            publicId: u.publicId,
            isPrimary: i === 0,
          },
        });
      }

      // create initial stock if provided (perbaikan check)
      if (data.initialStock !== undefined && data.storeId) {
        await tx.stock.create({
          data: {
            productId: product.id,
            storeId: data.storeId,
            quantity: data.initialStock,
          },
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { images: true, category: true },
      });
    });
  } catch (txErr) {
    // cleanup uploaded images if transaction failed
    for (const u of uploaded) {
      try { await destroyPublicId(u.publicId); } catch (_) { /* log, ignore */ }
    }

    // if prisma unique constraint error (P2002), map ke 409
    if ((txErr as any)?.code === "P2002") {
      throw { status: 409, message: "Unique constraint failed" };
    }
    // rethrow as generic server error
    throw { status: 500, message: (txErr instanceof Error ? txErr.message : String(txErr)) };
  }
};


// === LIST PRODUCTS (pagination + search + totalStock) ===
type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { images: true; category: true };
}> & {
  totalStock: number;
};

export type ProductListResult = {
  items: ProductWithRelations[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export const getProducts = async (
  page: number,
  limit: number,
  search?: string,
  categoryId?: string,
  minPrice?: number,
  maxPrice?: number,
  available?: boolean
): Promise<ProductListResult> => {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(minPrice !== undefined ? { price: { gte: minPrice } } : {}),
    ...(maxPrice !== undefined ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), lte: maxPrice } } : {}),
  };

  const skip = (page - 1) * limit;

  // kalau available=true → filter productId yang punya stok > 0
  let availableProductIds: string[] = [];
  
  if (available) {
  const stockGroups = await prisma.stock.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
  });

  availableProductIds = stockGroups
    .filter((s) => (s._sum.quantity ?? 0) > 0)
    .map((s) => s.productId);

  if (availableProductIds.length === 0) {
    return {
      items: [],
      meta: { total: 0, page, limit, totalPages: 1 },
    };
  }

  where.id = { in: availableProductIds };
}


  // ambil produk dengan filter
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: true, category: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const productIds = items.map((p) => p.id);

  // ambil stok terakumulasi
  const stockRows = await prisma.stock.groupBy({
  by: ["productId"],
  where: { productId: { in: productIds } },
  _sum: { quantity: true },
});

const sumsMap = new Map<string, number>();
for (const r of stockRows) {
  sumsMap.set(r.productId, r._sum.quantity ?? 0);
}

  const itemsWithStock: ProductWithRelations[] = items.map((p) => ({
    ...p,
    totalStock: sumsMap.get(p.id) ?? 0,
  }));

  const meta = {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };

  return { items: itemsWithStock, meta };
};

// === GET PRODUCT BY ID (detail + stocksPerStore + totalStock) ===
type ProductDetail = Prisma.ProductGetPayload<{
  include: { images: true; category: true; stocks: { include: { store: true } } };
}> & {
  totalStock: number;
  stocksPerStore: { storeId: string; storeName: string; quantity: number }[];
};

export const getProductById = async (id: string): Promise<ProductDetail | null> => {
  const p = await prisma.product.findUnique({
    where: { id, deletedAt: null },
    include: {
      images: true,
      category: true,
      stocks: { include: { store: true } },
    },
  });

  if (!p) return null;

  const totalStock = p.stocks.reduce((acc, s) => acc + (s.quantity ?? 0), 0);

  const stocksPerStore = p.stocks.map((s) => ({
    storeId: s.storeId,
    storeName: s.store?.name ?? "",
    quantity: s.quantity ?? 0,
  }));

  return {
    ...p,
    totalStock,
    stocksPerStore,
  };
};

/**
 * Update product (supports partial updates, image uploads, image removals, set primary image)
 * - Only intended to be used by admin flows (caller should check role)
 */
export const updateProduct = async (id: string, data: UpdateProductInput) => {
  // fetch existing
  const existingProduct = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!existingProduct) throw { status: 404, message: "Product not found" };

  // unique checks for name/sku when changing
  if (data.name && data.name !== existingProduct.name) {
    const conflict = await prisma.product.findUnique({ where: { name: data.name } });
    if (conflict) throw { status: 409, message: "Product name already exists" };
  }
  if (data.sku && data.sku !== existingProduct.sku) {
    const conflictSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (conflictSku) throw { status: 409, message: "SKU already exists" };
  }

  // validate numbers
  if (data.price !== undefined && data.price < 0) throw { status: 400, message: "price must be >= 0" };

  const removeIds = data.removeImageIds ?? [];
  const files = data.files ?? [];

  // enforce max 5 images after operation
  const willHaveAfter = existingProduct.images.length - removeIds.length + files.length;
  if (willHaveAfter > 5) throw { status: 400, message: "Maximum 5 images allowed per product" };

  // upload new images
  const uploaded: { url: string; publicId: string }[] = [];
  try {
    for (const f of files) {
      const up = await uploadBufferToCloudinary(f.buffer);
      uploaded.push({ url: up.url, publicId: up.publicId });
    }
  } catch (err) {
    for (const u of uploaded) await destroyPublicId(u.publicId);
    throw { status: 500, message: "Failed uploading images" };
  }

  // build tx ops
  const txOps: any[] = [];

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.sku !== undefined) updateData.sku = data.sku;

  txOps.push(prisma.product.update({ where: { id }, data: updateData }));

  // add uploaded images rows
  for (const u of uploaded) txOps.push(prisma.productImage.create({ data: { productId: id, url: u.url, publicId: u.publicId } }));

  // remove images: destroy cloud first
  for (const rid of removeIds) {
    const imgRow = existingProduct.images.find((im) => im.id === rid);
    if (!imgRow) {
      for (const u of uploaded) await destroyPublicId(u.publicId);
      throw { status: 400, message: `Image id ${rid} not found for this product` };
    }
    if (!imgRow.publicId) {
      for (const u of uploaded) await destroyPublicId(u.publicId);
      throw { status: 500, message: `Image ${rid} has no publicId` };
    }
    const destroyed = await destroyPublicId(imgRow.publicId);
    if (!destroyed) {
      for (const u of uploaded) await destroyPublicId(u.publicId);
      throw { status: 500, message: `Failed to destroy image ${rid} on Cloudinary` };
    }
    txOps.push(prisma.productImage.delete({ where: { id: rid } }));
  }

  // handle primary image
  if (data.primaryImageId) {
    txOps.push(prisma.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } }));
    txOps.push(prisma.productImage.update({ where: { id: data.primaryImageId }, data: { isPrimary: true } }));
  }

  // execute tx
  try {
    await prisma.$transaction(txOps);
  } catch (err) {
    for (const u of uploaded) await destroyPublicId(u.publicId);
    throw { status: 500, message: "DB transaction failed", detail: (err as any).message };
  }

  // return updated
  return prisma.product.findUnique({ where: { id }, include: { images: true, category: true } });
};

/**
 * Hard delete product (destroy images on cloud too)
 */
export const deleteProduct = async (id: string) => {
  const existing = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!existing) throw { status: 404, message: "Product not found" };

  // destroy images on cloud
  for (const img of existing.images) {
    if (img.publicId) {
      const ok = await destroyPublicId(img.publicId);
      if (!ok) throw { status: 500, message: `Failed to destroy image ${img.id} on Cloudinary` };
    }
  }

  // transaction remove images then product
  return prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: id } });
    return tx.product.delete({ where: { id } });
  });
};

export const deleteProductImage = async (imageId: string) => {
  const img = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!img) throw { status: 404, message: "Image not found" };
  if (img.publicId) {
    const ok = await destroyPublicId(img.publicId);
    if (!ok) throw { status: 500, message: "Failed to destroy image on Cloudinary" };
  }
  return prisma.productImage.delete({ where: { id: imageId } });
};

/**
 * Soft delete product
 */
export const softDeleteProduct = async (id: string) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: "Product not found" };
  if (existing.deletedAt) throw { status: 400, message: "Product already deleted" };
  return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
};
