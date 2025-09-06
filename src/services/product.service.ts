import { prisma } from "../db/connection";
import { Prisma } from "../generated/prisma";

export interface CreateProductInput {
  name: string;
  description?: string;
  sku: string;
  initialStock?: number;   // ✅ ganti dari "stocks"
  storeId?: string | null; // ✅ untuk relasi ke toko
  price: number;
  categoryId: string;
  weight_g: number;
  initialQuantity: number;
  files: Express.Multer.File[]
  user: {
    sub: string;
    role: "SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER";
    stores?: string[] | undefined;
  }
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
  initialStock?: number;   // ✅ ganti dari "stocks"
  storeId?: string | null; // ✅ untuk relasi ke toko
  categoryId?: string;
  sku: string;
  images?: {
    url: string;
    publicId?: string;
    isPrimary?: boolean;
    altText?: string;
  }[];
}

export const createProduct = async (data: CreateProductInput) => {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stocks: data.initialStock
        ? {
          create: [
            {
              storeId: data.storeId!,
              quantity: data.initialStock,
            },
          ],
        }
        : undefined,
        categoryId: data.categoryId,
      },
    });

    if (data.images && data.images.length > 0) {
      await tx.productImage.createMany({
        data: data.images.map((img, index) => ({
          productId: product.id,
          url: img.url,
          publicId: img.publicId ?? null,
          isPrimary: img.isPrimary ?? index === 0,
          altText: img.altText ?? null,
        })),
      });
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: { images: true },
    });
  });
};

export const getProducts = async (
  page: number,
  limit: number,
  search?: string) => {
  const where: Prisma.ProductWhereInput | undefined = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : undefined;

  return prisma.product.findMany({
    where,
    include: { images: true, category: true },
  });
};

export const getProductById = async (id: string) => {
  return prisma.product.findUnique({
    where: { id },
    include: { images: true, category: true },
  });
};

export const updateProduct = async (
  id: string,
  data: UpdateProductInput
) => {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stocks: data.initialStock
        ? {
          create: [
            {
              storeId: data.storeId!,
              quantity: data.initialStock,
            },
          ],
        }
        : undefined,
        categoryId: data.categoryId,
      },
    });

    if (data.images && data.images.length > 0) {
      await tx.productImage.deleteMany({ where: { productId: id } });

      await tx.productImage.createMany({
        data: data.images.map((img, index) => ({
          productId: id,
          url: img.url,
          publicId: img.publicId ?? null,
          isPrimary: img.isPrimary ?? index === 0,
          altText: img.altText ?? null,
        })),
      });
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: { images: true },
    });
  });
};

export const deleteProduct = async (id: string) => {
  return prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: id } });
    return tx.product.delete({ where: { id } });
  });
};

export const deleteProductImage = async (imageId: string) => {
  return prisma.productImage.delete({ where: { id: imageId } });
};
