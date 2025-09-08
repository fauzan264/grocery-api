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
  // basic unique checks
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
        const up = await uploadBufferToCloudinary(f.buffer);
        uploaded.push({ url: up.url, publicId: up.publicId });
      }
    } catch (err) {
      for (const u of uploaded) await destroyPublicId(u.publicId);
      throw { status: 500, message: "Failed uploading images" };
    }
  }

  // transaction: create product, then insert uploaded images
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        sku: data.sku,
        categoryId: data.categoryId,
        weight_g: data.weight_g,
      },
    });

    // insert uploaded images
    for (const [i, u] of uploaded.entries()) {
      await tx.productImage.create({
        data: {
          productId: product.id,
          url: u.url,
          publicId: u.publicId,
          isPrimary: i === 0, // gambar pertama jadi primary
        },
      });
    }

    // create initial stock if provided
    if (data.initialStock && data.storeId) {
      await tx.stock.create({
        data: { productId: product.id, storeId: data.storeId, quantity: data.initialStock },
      });
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: { images: true, category: true },
    });
  });
};


export const getProducts = async (page: number, limit: number, search?: string) => {
  const where: Prisma.ProductWhereInput | undefined = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : undefined;

  return prisma.product.findMany({ where, include: { images: true, category: true } });
};

export const getProductById = async (id: string) => {
  return prisma.product.findUnique({ where: { id }, include: { images: true, category: true, stocks: true } });
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

/**
 * Get stocks by product across stores (paginated)
 */
export const getProductStocks = async (productId: string, authUser: { sub: string; role: string; stores?: string[] }, page = 1, limit = 20) => {
  const p = Math.max(1, page);
  const l = Math.min(100, limit);
  const skip = (p - 1) * l;

  const whereClause: any = { productId };
  if (authUser.role === "ADMIN_STORE") {
    whereClause.storeId = { in: authUser.stores ?? [] };
  }

  const [total, items] = await prisma.$transaction([
    prisma.stock.count({ where: whereClause }),
    prisma.stock.findMany({ where: whereClause, skip, take: l, include: { store: true }, orderBy: { updatedAt: "desc" } }),
  ]);

  const data = items.map((it) => ({ storeId: it.storeId, storeName: it.store.name, quantity: it.quantity, updatedAt: it.updatedAt }));
  return { items: data, meta: { total, page: p, limit: l } };
};
