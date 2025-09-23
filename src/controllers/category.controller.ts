import { Request, Response } from "express";
import { categoryService } from "../services/category.service";

/**
 * NOTE:
 * - Semua response error konsisten pakai { success: false, message: "..." }
 * - Controller menangkap err.status (jika service melempar {status, message})
 *   dan mengembalikan status yang sesuai.
 */

// List categories (optional search)
export async function listCategoriesHandler(req: Request, res: Response) {
  try {
    const { search } = req.query;
    const categories = await categoryService.listCategories(
      search ? String(search) : undefined
    );
    return res.json({ success: true, data: categories });
  } catch (err: any) {
    console.error("listCategoriesHandler error:", err);
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return res.status(status).json({ success: false, message });
  }
}

// Get category detail
export async function getCategoryHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    return res.json({ success: true, data: category });
  } catch (err: any) {
    console.error("getCategoryHandler error:", err);
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return res.status(status).json({ success: false, message });
  }
}

// Create new category
export async function createCategoryHandler(req: Request, res: Response) {
  try {
    const { name } = req.body;
    const userId = (req as any).user?.id ?? null;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const category = await categoryService.createCategory(name, userId ?? undefined);
    return res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    console.error("createCategoryHandler error:", err);
    // map prisma unique constraint if service didn't already map it
    if (err?.code === "P2002" || err?.status === 409) {
      return res.status(409).json({ success: false, message: err?.message ?? "Category already exists" });
    }
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return res.status(status).json({ success: false, message });
  }
}

// Update category
export async function updateCategoryHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = (req as any).user?.id ?? null;

    const updated = await categoryService.updateCategory(id, {
      name: name ?? undefined,
      updatedBy: userId ?? undefined,
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("updateCategoryHandler error:", err);
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return res.status(status).json({ success: false, message });
  }
}

// Soft delete category
export async function softDeleteCategoryHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id ?? null;

    const deleted = await categoryService.softDeleteCategory(id, userId ?? undefined);
    return res.json({ success: true, data: deleted, message: "Category soft-deleted" });
  } catch (err: any) {
    console.error("softDeleteCategoryHandler error:", err);
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return res.status(status).json({ success: false, message });
  }
}

// Restore category
export async function restoreCategoryHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id ?? null;

    const restored = await categoryService.restoreCategory(id, userId ?? undefined);
    return res.json({ success: true, data: restored, message: "Category restored" });
  } catch (err: any) {
    console.error("restoreCategoryHandler error:", err);
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return res.status(status).json({ success: false, message });
  }
}

// Get category logs (SUPER_ADMIN)
export async function getCategoryLogsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const logs = await categoryService.getCategoryLogs(id);
    return res.json({ success: true, data: logs });
  } catch (err: any) {
    console.error("getCategoryLogsHandler error:", err);
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return res.status(status).json({ success: false, message });
  }
}

// Get category tree
export async function getCategoryTreeHandler(req: Request, res: Response) {
  try {
    const tree = await categoryService.getCategoryTree();
    return res.json({ success: true, data: tree });
  } catch (err: any) {
    console.error("getCategoryTreeHandler error:", err);
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    return res.status(status).json({ success: false, message });
  }
}
