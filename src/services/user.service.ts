import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllUsers = async () => {
  return prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true } });
};

export const getUserById = (id: string) => prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, phone: true } });

export const createUser = async (data: { name?: string; email: string; passwordHash: string; role?: string; phone?: string }) => {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role || 'STORE_ADMIN',
      phone: data.phone,
    },
    select: { id: true, name: true, email: true, role: true, phone: true },
  });
};

export const updateUser = (id: string, update: Partial<{ name: string; role: string; phone: string; passwordHash: string }>) =>
  prisma.user.update({
    where: { id },
    data: update,
    select: { id: true, name: true, email: true, role: true, phone: true },
  });

export const deleteUser = (id: string) => prisma.user.delete({ where: { id } });
