import { Prisma, PrismaClient, Category, CategoryLog } from "../generated/prisma";

const prisma = new PrismaClient();

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

  // 2. Get category detail by ID
  async getCategoryById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
    });
  },

  // 3. Create category
  async createCategory(name: string, createdBy?: string): Promise<Category> {
    const newCategory = await prisma.category.create({
      data: { name, createdBy: createdBy ?? null },
    });

    // create log: note kita pakai 'performedBy' sesuai schema
    await prisma.categoryLog.create({
      data: {
        action: "CREATE",
        categoryId: newCategory.id,
        payload: Prisma.JsonNull,
        performedBy: createdBy ?? null,
      },
    });

    return newCategory;
  },

  // 4. Update category
  async updateCategory(
    id: string,
    data: { name?: string; updatedBy?: string }
  ): Promise<Category> {
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
      },
    });

    // log update (performedBy)
    await prisma.categoryLog.create({
      data: {
        action: "UPDATE",
        categoryId: updatedCategory.id,
        // payload bisa berisi perubahan; kalau kosong pakai JsonNull
        payload: (data && (data as unknown)) ? (data as Prisma.InputJsonValue) : Prisma.JsonNull,
        performedBy: data.updatedBy ?? null,
      },
    });

    return updatedCategory;
  },

  // 5. Soft delete category
  async softDeleteCategory(id: string, deletedBy?: string): Promise<Category> {
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
        // jangan include fields yang nggak ada di schema
      },
    });
  },

  // 8. Get category tree (nested)
  async getCategoryTree(): Promise<any[]> {
    // ambil semua category yang masih aktif
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

    // helper buat nyusun tree
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
