import { Request, Response } from "express";
import { categoryService } from "../services/category.service";

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
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Get category detail
export async function getCategoryHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    if (!category) return res.status(404).json({ success: false, error: "Category not found" });
    return res.json({ success: true, data: category });
  } catch (err: any) {
    console.error("getCategoryHandler error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Create new category
export async function createCategoryHandler(req: Request, res: Response) {
  try {
    const { name } = req.body;
    const userId = (req as any).user?.id ?? null;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, error: "Name is required" });
    }

    const category = await categoryService.createCategory(name, userId ?? undefined);
    return res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    console.error("createCategoryHandler error:", err);
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, error: "Category already exists" });
    }
    return res.status(500).json({ success: false, error: err.message });
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
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Soft delete category
export async function softDeleteCategoryHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id ?? null;

    const deleted = await categoryService.softDeleteCategory(id, userId ?? undefined);
    return res.json({ success: true, data: deleted });
  } catch (err: any) {
    console.error("softDeleteCategoryHandler error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Restore category
export async function restoreCategoryHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id ?? null;

    const restored = await categoryService.restoreCategory(id, userId ?? undefined);
    return res.json({ success: true, data: restored });
  } catch (err: any) {
    console.error("restoreCategoryHandler error:", err);
    return res.status(500).json({ success: false, error: err.message });
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
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Get category tree
export async function getCategoryTreeHandler(req: Request, res: Response) {
  try {
    const tree = await categoryService.getCategoryTree();
    return res.json({ success: true, data: tree });
  } catch (err: any) {
    console.error("getCategoryTreeHandler error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
