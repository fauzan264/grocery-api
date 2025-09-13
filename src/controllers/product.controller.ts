import { Response, Request, NextFunction, Router } from "express";
import {
  CreateProductInput,
  createProduct,
  getProducts,
  getProductById,
  deleteProductImage,
  updateProduct,
  softDeleteProduct,
} from "../services/product.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import multer from "multer";

// Multer memory storage for small uploads (limit 1MB per image)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1_000_000 } });

// Helper type: using AuthRequest from middleware (req.user comes from auth middleware)
type LocalAuthUser = { sub?: string; role: "SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER"; stores?: string[] };

const isSuperAdmin = (user?: LocalAuthUser) => user?.role === "SUPER_ADMIN";
const isAdminStore = (user?: LocalAuthUser) => user?.role === "ADMIN_STORE";

/**
 * CREATE product
 * - only SUPER_ADMIN allowed
 * - expects multipart/form-data (files field name: "images" or multiple files)
 */
export async function createProductHandler(req: AuthRequest, res: Response) {
  try {

    const body = req.body as Record<string, any>;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files || files.length === 0) {
  return res.status(400).json({ success: false, message: "Minimum 1 product image is required" });
}

    const payload: CreateProductInput = {
      name: String(body.name),
      sku: body.sku ? String(body.sku).toUpperCase() : "",
      description: body.description ?? undefined,
      price: body.price !== undefined ? parseInt(String(body.price), 10) : 0,
      weight_g: body.weight_g !== undefined ? parseInt(String(body.weight_g), 10) : 0,
      categoryId: body.categoryId ?? null,
      initialStock: body.initialStock !== undefined ? Number(body.initialStock) : undefined,
      storeId: body.storeId ?? null,
      files,
      user: req.user as any,
    };

    const product = await createProduct(payload);
    return res.status(201).json({ success: true, data: product });
  } catch (err: unknown) {
    console.error(err);
    const status = (err as any).status || 400;
    const message = err instanceof Error ? err.message : String(err);
    return res.status(status).json({ success: false, message });
  }
}

/**
 * LIST products (public)
 */
export async function listProductsHandler(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit ?? "20"), 10)));
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const available = req.query.available === "true";

    const { items, meta } = await getProducts(page, limit, search, categoryId, minPrice, maxPrice, available);

    return res.status(200).json({ success: true, data: items, meta });
  } catch (err) {
    console.error("listProductsHandler error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET product detail
 */
export async function getProductHandler(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const p = await getProductById(id);
    if (!p) return res.status(404).json({ success: false, message: "Product not found" });
    return res.status(200).json({ success: true, data: p });
  } catch (err) {
    console.error("getProductHandler error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * DELETE product image by id
 * - only SUPER_ADMIN allowed
 */
export async function deleteProductImageHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Only SUPER_ADMIN can delete images" });
    }

    const imageId = req.params.imageId as string;
    await deleteProductImage(imageId);

    return res.json({ success: true, message: "Image deleted" });
  } catch (err: unknown) {
    console.error(err);
    const status = (err as any).status || 400;
    const message = err instanceof Error ? err.message : String(err);
    return res.status(status).json({ success: false, message });
  }
}

/**
 * UPDATE product (admin)
 * - multer middleware to accept up to 5 images (field name: "images")
 * - controller only parses input and calls updateProduct service
 */
export const updateProductHandler = [
  upload.array("images", 5),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUser = (req as any).user as LocalAuthUser | undefined;
      if (!isSuperAdmin(authUser)) {
        return res.status(403).json({ success: false, message: "Forbidden: only SUPER_ADMIN can update products" });
      }

      const productId = req.params.id;
      const {
        name,
        description,
        price,
        weight_g,
        categoryId,
        sku,
        primaryImageId,
        removeImageIds,
      } = req.body as Record<string, any>;

      // parse removeImageIds if present (JSON string expected)
      let removeIds: string[] = [];
      if (removeImageIds) {
        try {
          removeIds = typeof removeImageIds === "string" ? JSON.parse(removeImageIds) : removeImageIds;
          if (!Array.isArray(removeIds)) removeIds = [];
        } catch (err) {
          return res.status(400).json({ success: false, message: "removeImageIds must be a JSON array string" });
        }
      }

      // basic field validations
      if (price !== undefined && Number(price) < 0)
        return res.status(400).json({ success: false, message: "price must be >= 0" });
      if (weight_g !== undefined && Number(weight_g) < 0)
        return res.status(400).json({ success: false, message: "weight_g must be >= 0" });
      if (sku && typeof sku === "string" && sku.length > 50)
        return res.status(400).json({ success: false, message: "sku too long" });

      const files = (req as any).files as Express.Multer.File[] | undefined;

      // Prepare update payload for service
      const payload = {
        name: name !== undefined ? String(name) : undefined,
        description: description !== undefined ? String(description) : undefined,
        price: price !== undefined ? Number(price) : undefined,
        weight_g: weight_g !== undefined ? Number(weight_g) : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        sku: sku !== undefined ? (String(sku) || null) : undefined,
        primaryImageId: primaryImageId ?? undefined,
        removeImageIds: removeIds,
        files: files ?? [],
      };

      const updated = await updateProduct(productId, payload as any);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      console.error(err);
      const status = (err as any).status || 500;
      const message = (err as any).message || "Internal server error";
      return res.status(status).json({ success: false, message, detail: (err as any).detail });
    }
  },
];

/**
 * SOFT DELETE product (admin)
 */
export const softDeleteProductHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {

    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ success: false, message: "Unauthorized: no user" });
    }

    if (!isSuperAdmin(authUser)) {
      console.warn("Forbidden: user is not SUPER_ADMIN", { userRole: authUser.role });
      return res.status(403).json({ success: false, message: "Forbidden: only SUPER_ADMIN can delete products" });
    }

    const productId = req.params.id;
    const deleted = await softDeleteProduct(productId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: deleted, message: "Product soft-deleted" });
  } catch (err) {
    console.error("softDeleteProductHandler error:", err);
    const status = (err as any)?.status ?? 500;
    const message = (err as any)?.message ?? "Internal server error";
    return res.status(status).json({ success: false, message });
  }
};
