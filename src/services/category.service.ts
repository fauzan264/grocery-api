import { Prisma, Category, CategoryLog } from "../generated/prisma";
import slugify from "slugify";
import { prisma } from "../db/connection"; // PENTING: gunakan shared prisma instance

export const categoryService = {
  // 1. List categories (with optional search)
  async listCategories(search?: string): Promise<Category[]> {
    const whereClause: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            name: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    return prisma.category.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
  },

  // 2. Get category detail by ID (return null if soft-deleted)
  async getCategoryById(id: string): Promise<Category | null> {
    // findFirst with deletedAt null ensures soft-deleted categories are not returned
    return prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
  },

  // 3. Create category
  async createCategory(name: string, createdBy?: string): Promise<Category> {
    const slug = slugify(name, { lower: true, strict: true });

    try {
      const newCategory = await prisma.category.create({
        data: {
          name,
          slug,
          createdBy: createdBy ?? null,
        },
      });

      await prisma.categoryLog.create({
        data: {
          action: "CREATE",
          categoryId: newCategory.id,
          payload: Prisma.JsonNull,
          performedBy: createdBy ?? null,
        },
      });

      return newCategory;
    } catch (err: any) {
      // Map prisma unique constraint errors to friendly errors
      if (err?.code === "P2002") {
        // duplicate name/slug
        throw { status: 409, message: "Category already exists" };
      }
      throw { status: 500, message: err?.message ?? "Failed creating category" };
    }
  },

  // 4. Update category
  async updateCategory(id: string, data: { name?: string; updatedBy?: string }): Promise<Category> {
    const exists = await prisma.category.findUnique({ where: { id } });
    if (!exists) throw { status: 404, message: "Category not found" };

    try {
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          updatedAt: new Date(),
        },
      });

      await prisma.categoryLog.create({
        data: {
          action: "UPDATE",
          categoryId: updatedCategory.id,
          payload: (data as unknown) ? (data as Prisma.InputJsonValue) : Prisma.JsonNull,
          performedBy: data.updatedBy ?? null,
        },
      });

      return updatedCategory;
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw { status: 409, message: "Category with this name already exists" };
      }
      throw { status: 500, message: err?.message ?? "Failed updating category" };
    }
  },

  // 5. Soft delete category
  async softDeleteCategory(id: string, deletedBy?: string): Promise<Category> {
    const exists = await prisma.category.findUnique({ where: { id } });
    if (!exists) throw { status: 404, message: "Category not found" };
    if (exists.deletedAt) throw { status: 400, message: "Category already deleted" };

    const deletedCategory = await prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await prisma.categoryLog.create({
      data: {
        action: "SOFT_DELETE",
        categoryId: deletedCategory.id,
        payload: Prisma.JsonNull,
        performedBy: deletedBy ?? null,
      },
    });

    return deletedCategory;
  },

  // 6. Restore category
  async restoreCategory(id: string, restoredBy?: string): Promise<Category> {
    const exists = await prisma.category.findUnique({ where: { id } });
    if (!exists) throw { status: 404, message: "Category not found" };
    if (!exists.deletedAt) throw { status: 400, message: "Category is not deleted" };

    const restoredCategory = await prisma.category.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true,
      },
    });

    await prisma.categoryLog.create({
      data: {
        action: "RESTORE",
        categoryId: restoredCategory.id,
        payload: Prisma.JsonNull,
        performedBy: restoredBy ?? null,
      },
    });

    return restoredCategory;
  },

  // 7. Get category logs (with user include)
  async getCategoryLogs(categoryId: string): Promise<(CategoryLog & {
    performedByUser?: { id: string; fullName: string; email: string } | null;
  })[]> {
    // include performedByUser sesuai nama relasi di schema
    return prisma.categoryLog.findMany({
      where: { categoryId },
      orderBy: { createdAt: "desc" },
      include: {
        performedByUser: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  },

  // 8. Get category tree (nested)
  async getCategoryTree(): Promise<any[]> {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
      },
    });

    const categoryMap: Record<string, any> = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    const tree: any[] = [];
    categories.forEach(cat => {
      if (cat.parentId && categoryMap[cat.parentId]) {
        categoryMap[cat.parentId].children.push(categoryMap[cat.id]);
      } else {
        tree.push(categoryMap[cat.id]);
      }
    });

    return tree;
  },
};
