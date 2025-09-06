import prisma from "../prisma/client";
import { CloudinaryUploadResult, uploadBufferToCloudinary } from "../utils/cloudinary";
import { AuthRequest } from "../middlewares/auth.middleware";
import { v2 as cloudinary } from "cloudinary";


export interface CreateProductInput {
name: string;
sku: string;
description?: string;
price: number;
weight_g?: number | null;
categoryId?: string | null;
initialQuantity?: number;
storeId?: string | null;
files?: Express.Multer.File[];
user?: AuthRequest["user"];
}


export async function createProduct(input: CreateProductInput) {
const {
name,
sku,
description,
price,
weight_g,
categoryId,
initialQuantity = 0,
storeId,
files = [],
user,
} = input;


if (price < 0) throw new Error("Price must be >= 0");
if (weight_g !== undefined && weight_g !== null && weight_g < 0) throw new Error("weight_g must be >= 0");


// upload images first
const uploads: CloudinaryUploadResult[] = [];
for (const f of files) {
const up = await uploadBufferToCloudinary(f.buffer, `products/${process.env.PROJECT_ENV || "dev"}`);
uploads.push(up);
}


// transaction: create product, images, and optional stock+journal
const result = await prisma.$transaction(async (tx:any) => {
// check unique name/sku
const existingByName = await tx.product.findUnique({ where: { name } as any }).catch(() => null);
if (existingByName) {
throw new Error("Product with this name already exists. Use stocks endpoint to add to store.");
}
const existingBySku = await tx.product.findUnique({ where: { sku } as any }).catch(() => null);
if (existingBySku) {
throw new Error("SKU already exists");
}

    const product = await tx.product.create({
        data: {
        name,
        sku,
        description,
        price,
        weight_g: weight_g ?? null,
        categoryId: categoryId ?? null,
        },
    });

// create images
for (const u of uploads) {
    await tx.productImage.create({
     data: {
        productId: product.id,
        url: u.secure_url,
        publicId: u.public_id,
        isPrimary: false,
      },
     });
    }

// create stock if storeId provided
if (storeId) {
    const stock = await tx.stock.create({ data: { productId: product.id, storeId, quantity: initialQuantity } });
        await tx.stockJournal.create({
            data: {
                stockId: stock.id,
                changeType: initialQuantity > 0 ? "INCREASE" : "ADJUSTMENT",
                journalType: initialQuantity > 0 ? "PURCHASE" : "ADJUSTMENT",
                quantityOld: 0,
                quantityDiff: stock.quantity,
                quantityNew: stock.quantity,
                reason: "Initial stock",
                createdBy: user?.sub ?? null,
            },
        });
    }


    return product;
});


    return result;
}

export async function getProducts(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
        ? {
            OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ],
    }
: {};


const [items, total] = await Promise.all([
    prisma.product.findMany({ where, include: { images: true }, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.product.count({ where }),
]);


    return { items, total, page, limit };
}

export async function getProductById(id: string) {
return prisma.product.findUnique({ where: { id }, include: { images: true, stocks: true } });
}

export const destroyFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error("Cloudinary delete failed: " + (error as Error).message);
  }
};

export async function deleteProductImage(imageId: string) {
    // get publicId
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) throw new Error("Image not found");
    if (!image.publicId) throw new Error("Image missing publicId");


// try destroy in cloudinary
    try {
        await destroyFromCloudinary(image.publicId);
    } catch (err) {
        throw new Error("Failed to delete image from Cloudinary: " + (err instanceof Error ? err.message : String(err)));
    }


    // delete DB row
    await prisma.productImage.delete({ where: { id: imageId } });
    return true;
}