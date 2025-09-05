import snakecaseKeys from "snakecase-keys";
import { prisma } from "../db/connection";
import bcrypt from "bcrypt"
import { UserStatus, UserRole } from "../generated/prisma";

//admin super service
 const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

/* DTO types */
type CreatePayload = {
  fullName: string;
  email: string;
  dateOfBirth?: string | Date | null;
  phoneNumber?: string | null;
  userRole: "ADMIN_STORE" | "CUSTOMER" | "SUPER_ADMIN" | string;
  password?: string | null;
  photoProfile?: string | null;
};

type ListOpts = {
  role?: string;
  page?: number;
  limit?: number;
  q?: string;
};

type UpdatePayload = {
  fullName?: string;
  phoneNumber?: string | null;
  password?: string | null;
  status?: "ACTIVE" | "INACTIVE" | string;
  photoProfile?: string | null;
};

/* helper to remove sensitive */
const strip = (obj: any) => {
  if (!obj) return obj;
  const { password, ...rest } = obj;
  return rest;
};

/* create user (SUPER_ADMIN) */
export const createUserAdminService = async (payload: CreatePayload) => {
  const { fullName, email, dateOfBirth, phoneNumber, userRole, password, photoProfile } = payload;

  // business rule: ADMIN_STORE must have password
  if (String(userRole) === "ADMIN_STORE" && !password) {
    throw { message: "Password is required for ADMIN_STORE", isExpose: true };
  }

  try {
    const data: any = {
      fullName,
      email,
      phoneNumber: phoneNumber || null,
      userRole,
      photoProfile: photoProfile || null,
      verified: true, // created by SUPER_ADMIN -> mark verified
      status: UserStatus.ACTIVE,
    };

    if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth as any);
    if (password) data.password = await bcrypt.hash(password, SALT_ROUNDS);

    const created = await prisma.user.create({
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userRole: true,
        status: true,
        verified: true,
        photoProfile: true,
        createdAt: true,
      },
    });

    return snakecaseKeys(strip(created));
  } catch (err: any) {
    if (err?.code === "P2002") {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes("email")) throw { message: "Email already exists", isExpose: true };
      if (Array.isArray(target) && target.includes("phone_number")) throw { message: "Phone number already exists", isExpose: true };
    }
    console.error("createUserAdminService err:", err);
    throw { message: err?.message || "Failed to create user", isExpose: false };
  }
};

/* list users with pagination + filter */
export const listUsersAdminService = async ({ role, page = 1, limit = 20, q }: ListOpts) => {
  const skip = (page - 1) * limit;
  const where: any = { deletedAt: null };

  if (role) where.userRole = role;
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  try {
    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          userRole: true,
          status: true,
          photoProfile: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
      data: snakecaseKeys(items),
    };
  } catch (err: any) {
    console.error("listUsersAdminService err:", err);
    throw { message: err?.message || "Failed to list users", isExpose: false };
  }
};

/* get user by id */
export const getUserAdminByIdService = async ({ id }: { id: string }) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userRole: true,
        status: true,
        verified: true,
        photoProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw { message: "User not found", isExpose: true };
    return snakecaseKeys(strip(user));
  } catch (err: any) {
    console.error("getUserAdminByIdService err:", err);
    throw { message: err?.message || "Failed to get user", isExpose: false };
  }
};

/* update user */
export const updateUserAdminService = async ({ id, payload }: { id: string; payload: UpdatePayload }) => {
  try {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw { message: "User not found", isExpose: true };

    const data: any = { ...payload };

    if (payload.password) data.password = await bcrypt.hash(payload.password, SALT_ROUNDS);

    // prevent role change here by default (optional)
    if ((data as any).userRole) delete (data as any).userRole;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userRole: true,
        status: true,
        photoProfile: true,
        updatedAt: true,
      },
    });

    return snakecaseKeys(strip(updated));
  } catch (err: any) {
    if (err?.code === "P2002") {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes("email")) throw { message: "Email already exists", isExpose: true };
      if (Array.isArray(target) && target.includes("phone_number")) throw { message: "Phone number already exists", isExpose: true };
    }
    console.error("updateUserAdminService err:", err);
    throw { message: err?.message || "Failed to update user", isExpose: false };
  }
};

/* soft delete user */
export const deleteUserAdminService = async ({ id }: { id: string }) => {
  try {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw { message: "User not found", isExpose: true };

    // optional: revoke refresh tokens here if you store them
    // await prisma.refreshToken.deleteMany({ where: { userId: id } });

    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });

    return;
  } catch (err: any) {
    console.error("deleteUserAdminService err:", err);
    throw { message: err?.message || "Failed to delete user", isExpose: false };
  }
};