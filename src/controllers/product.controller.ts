import { Response } from "express";
import { 
  CreateProductInput, 
  createProduct, 
  getProducts, 
  getProductById, 
  deleteProductImage 
} from "../services/product.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export async function createProductHandler(req: AuthRequest, res: Response) {
  try {
    // hanya SUPER_ADMIN yang boleh create product
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only SUPER_ADMIN can create products",
      });
    }

    const body = req.body as Record<string, any>;
    const files = req.files as Express.Multer.File[] | undefined;

    const payload: CreateProductInput = {
      name: body.name,
      sku: body.sku?.toUpperCase(), // ✅ sku diaktifkan lagi
      description: body.description,
      price: parseInt(String(body.price), 10),
      weight_g: body.weight_g ? parseInt(String(body.weight_g), 10) : 0,
      categoryId: body.categoryId ?? null,
      initialQuantity: body.initialQuantity
        ? parseInt(String(body.initialQuantity), 10)
        : 0,
      storeId: body.storeId ?? null,
      files: files ?? [],
      user: req.user,
    };

    const product = await createProduct(payload);
    return res.status(201).json({ success: true, data: product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ success: false, message });
  }
}

export async function listProductsHandler(req: AuthRequest, res: Response) {
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const search = req.query.search ? String(req.query.search) : undefined;

  const data = await getProducts(page, limit, search);
  return res.json({ success: true, data });
}

export async function getProductHandler(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const p = await getProductById(id);
  if (!p) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  return res.json({ success: true, data: p });
}

export async function deleteProductImageHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only SUPER_ADMIN can delete images",
      });
    }

    const imageId = req.params.imageId as string;
    await deleteProductImage(imageId);

    return res.json({ success: true, message: "Image deleted" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ success: false, message });
  }
}
