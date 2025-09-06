import snakecaseKeys from "snakecase-keys";
import { prisma } from "../db/connection";
import { User, UserStatus } from "../generated/prisma";
import {
  ICreateAddressesServiceProps,
  IDeleteAddressesServiceProps,
  IGetMyAddressesByIDServiceProps,
  IUpdateAddressesServiceProps,
} from "../types/user";
import bcrypt from "bcrypt";

/* ========== Config / Helpers ========== */
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const stripSensitive = (obj: any) => {
  if (!obj) return obj;
  const { password, ...rest } = obj;
  return rest;
};

export const getMyProfileService = async ({ id }: Pick<User, "id">) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    omit: {
      password: true,
      deletedAt: true,
    },
  });

  if (!user) {
    throw { message: "User not found", isExpose: true };
  }

  return snakecaseKeys(user);
};

export const getMyAddressesService = async ({ id }: Pick<User, "id">) => {
  const addresses = await prisma.userAddress.findMany({
    where: {
      userId: id,
      deletedAt: null,
    },
    omit: {
      deletedAt: true,
    },
  });

  const responseFormatter = addresses.map((address: any) => {
    return snakecaseKeys({
      ...address,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
    });
  });

  return responseFormatter;
};

export const getMyAddressesByIDService = async ({
  userId,
  addressId,
}: IGetMyAddressesByIDServiceProps) => {
  const address = await prisma.userAddress.findUnique({
    where: {
      id: addressId,
      userId,
      deletedAt: null,
    },
    omit: {
      deletedAt: true,
    },
  });

  if (!address) {
    throw { message: "Address not found", isExpose: true };
  }

  const formattedResponse = {
    ...address,
    latitude: Number(address.latitude),
    longitude: Number(address.longitude),
  };

  return snakecaseKeys(formattedResponse);
};

export const getMyStoreService = async ({ id }: Pick<User, "id">) => {
  const store = await prisma.userStore.findFirst({
    where: {
      userId: id,
    },
    include: {
      store: true,
    },
    omit: {
      userId: true,
      storeId: true,
    },
  });

  if (!store) {
    throw { message: "Store not found", isExpose: true };
  }

  return store;
};

export const createAddressesService = async ({
  city,
  province,
  subdistrict,
  address,
  latitude,
  longitude,
  userId,
}: ICreateAddressesServiceProps) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (user?.status == UserStatus.INACTIVE) {
    throw { message: "User status inactive", isExpose: true };
  }

  if (!user || user.deletedAt !== null) {
    throw { message: "User not found", isExpose: true };
  }

  const userAddress = await prisma.userAddress.create({
    data: {
      city,
      province,
      subdistrict,
      address,
      latitude,
      longitude,
      userId,
    },
    omit: {
      userId: true,
      deletedAt: true,
    },
  });

  const formattedResponse = {
    ...userAddress,
    latitude: Number(userAddress.latitude),
    longitude: Number(userAddress.longitude),
  };

  return snakecaseKeys(formattedResponse);
};

export const updateAddressesService = async ({
  addressId,
  city,
  province,
  subdistrict,
  address,
  latitude,
  longitude,
  userId,
}: IUpdateAddressesServiceProps) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (user?.status == UserStatus.INACTIVE) {
    throw { message: "User status inactive", isExpose: true };
  }

  if (!user || user.deletedAt !== null) {
    throw { message: "User not found", isExpose: true };
  }

  const userAddress = await prisma.userAddress.update({
    data: {
      city,
      province,
      subdistrict,
      address,
      latitude,
      longitude,
    },
    where: {
      id: addressId,
    },
    omit: {
      userId: true,
      deletedAt: true,
    },
  });

  const formattedResponse = {
    ...userAddress,
    latitude: Number(userAddress.latitude),
    longitude: Number(userAddress.longitude),
  };

  return snakecaseKeys(formattedResponse);
};

export const deleteAddressesService = async ({
  addressId,
  userId,
}: IDeleteAddressesServiceProps) => {
  const checkAddress = await prisma.userAddress.findUnique({
    where: {
      id: addressId,
      userId,
    },
  });

  if (!checkAddress || checkAddress.deletedAt != null) {
    throw { message: "Address not found", isExpose: true };
  }

  await prisma.userAddress.update({
    data: {
      deletedAt: new Date(),
    },
    where: {
      id: addressId,
    },
  });
};

/* ========== Fungsi super admin  ========== */

/* DTO types internal */
export interface CreateUserArgs {
  fullName: string;
  email: string;
  dateOfBirth?: string | Date | null;
  phoneNumber?: string | null;
  userRole: "ADMIN_STORE" | "CUSTOMER" | "SUPER_ADMIN" | string;
  password?: string | null;
  photoProfile?: string | null;
}

export interface UpdateUserArgs {
  id: string;
  payload: {
    fullName?: string;
    email?: string;
    dateOfBirth?: string | Date | null;
    phoneNumber?: string | null;
    userRole?: "ADMIN_STORE" | "CUSTOMER" | "SUPER_ADMIN" | string;
    password?: string | null;
    photoProfile?: string | null;
    status?: "ACTIVE" | "INACTIVE" | string;
  };
}

type ListOpts = {
  role?: string;
  page?: number;
  limit?: number;
  q?: string;
};
/* create user (SUPER_ADMIN) */
export const createUserAdminService = async (payload: CreateUserArgs) => {
  const {
    fullName,
    email,
    dateOfBirth,
    phoneNumber,
    userRole,
    password,
    photoProfile,
  } = payload;

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

    return snakecaseKeys(stripSensitive(created));
  } catch (err: any) {
    if (err?.code === "P2002") {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes("email"))
        throw { message: "Email already exists", isExpose: true };
      if (Array.isArray(target) && target.includes("phone_number"))
        throw { message: "Phone number already exists", isExpose: true };
    }
    console.error("createUserAdminService err:", err);
    throw { message: err?.message || "Failed to create user", isExpose: false };
  }
};

/* list users with pagination + filter */
export const listUsersAdminService = async ({
  role,
  page = 1,
  limit = 20,
  q,
}: ListOpts) => {
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
    return snakecaseKeys(stripSensitive(user));
  } catch (err: any) {
    console.error("getUserAdminByIdService err:", err);
    throw { message: err?.message || "Failed to get user", isExpose: false };
  }
};

export const updateUserAdminService = async ({
  id,
  payload,
}: UpdateUserArgs) => {
  // cek dulu user ada
  const existing = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw { message: "User not found", isExpose: true };

  try {
    // build data hanya dengan field yg valid pada schema (camelCase)
    const data: any = {};

    if (payload.fullName !== undefined) data.fullName = payload.fullName;
    if (payload.email !== undefined) data.email = payload.email;
    if (payload.dateOfBirth !== undefined)
      data.dateOfBirth = payload.dateOfBirth
        ? new Date(payload.dateOfBirth as any)
        : null;
    if (payload.phoneNumber !== undefined)
      data.phoneNumber = payload.phoneNumber;
    if (payload.status !== undefined) data.status = payload.status;
    if (payload.photoProfile !== undefined)
      data.photoProfile = payload.photoProfile;

    // jangan izinkan change role lewat endpoint ini (security)
    // if (payload.userRole !== undefined) data.userRole = payload.userRole; // uncomment only if allowed & validated

    if (payload.password !== undefined && payload.password !== null) {
      data.password = await bcrypt.hash(payload.password, SALT_ROUNDS);
    }

    data.updatedAt = new Date();

    // DEBUG: uncomment bila perlu
    // console.log("mapped update data ->", data);

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
        createdAt: true,
      },
    });

    return snakecaseKeys(stripSensitive(updated)); // tetap return snake_case jika kamu konsisten sebelumnya
  } catch (err: any) {
    if (err?.code === "P2002") {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes("email"))
        throw { message: "Email already exists", isExpose: true };
      if (Array.isArray(target) && target.includes("phone_number"))
        throw { message: "Phone number already exists", isExpose: true };
    }
    console.error("updateUserAdminService err:", err);
    throw { message: err?.message || "Failed to update user", isExpose: false };
  }
};

/* soft delete user */
export const deleteUserAdminService = async ({ id }: { id: string }) => {
  try {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw { message: "User not found", isExpose: true };

    // optional: revoke refresh tokens here if you store them
    // await prisma.refreshToken.deleteMany({ where: { userId: id } });

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return;
  } catch (err: any) {
    console.error("deleteUserAdminService err:", err);
    throw { message: err?.message || "Failed to delete user", isExpose: false };
  }
};
