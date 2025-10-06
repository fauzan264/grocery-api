import snakecaseKeys from "snakecase-keys";
import { prisma } from "../db/connection";
import { Store, StoreStatus, UserRole } from "../generated/prisma";
import {
  ICreateAssignStoreAdminServiceProps,
  ICreateStoreServiceProps,
  IGetAllStoreServiceProps,
  IUpdateStoreServiceProps,
  LogoStore,
} from "../types/store";
import { cloudinaryUpload } from "../lib/cloudinary.upload";

export const getAllStoreService = async ({
  name,
  province,
  city,
  district,
  status,
  page,
  limit,
}: IGetAllStoreServiceProps) => {
  const where: any = {
    deletedAt: null,
  };

  if (name) {
    where.name = {
      contains: name,
      mode: "insensitive",
    };
  }

  if (province) {
    where.province = {
      is: {
        name: {
          contains: province,
          mode: "insensitive",
        },
      },
    };
  }

  if (city) {
    where.city = {
      is: {
        name: {
          contains: city,
          mode: "insensitive",
        },
      },
    };
  }

  if (district) {
    where.district = {
      is: {
        name: {
          contains: district,
          mode: "insensitive",
        },
      },
    };
  }

  if (status && Object.values(StoreStatus).includes(status as StoreStatus)) {
    where.status = status;
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.max(Number(limit) || 10, 1);
  const offset = (pageNumber - 1) * limitNumber;

  const totalData = await prisma.store.count({
    where: Object.keys(where).length > 0 ? where : undefined,
  });

  const totalPages = Math.ceil(totalData / limitNumber);

  const stores = await prisma.store.findMany({
    where: Object.keys(where).length > 0 ? where : {},
    skip: offset,
    take: limitNumber,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      logo: true,
      description: true,
      address: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      province: {
        select: {
          id: true,
          name: true,
        },
      },
      city: {
        select: {
          id: true,
          name: true,
        },
      },
      district: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  stores.map((store) => {
    snakecaseKeys(store);
  });

  const response = {
    stores,
    pagination: {
      current_page: pageNumber,
      per_page: limitNumber,
      total_data: totalData,
      total_page: totalPages,
    },
  };

  return response;
};

export const getStoreByIdService = async ({ id }: Pick<Store, "id">) => {
  const store = await prisma.store.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      logo: true,
      description: true,
      address: true,
      latitude: true,
      longitude: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      province: {
        select: {
          id: true,
          name: true,
        },
      },
      city: {
        select: {
          id: true,
          name: true,
        },
      },
      district: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!store) {
    throw { message: "Store not found.", isExpose: true };
  }

  const formattedResponse = {
    ...store,
    latitude: Number(store.latitude),
    longitude: Number(store.longitude),
  };

  return snakecaseKeys(formattedResponse);
};

export const createStoreService = async ({
  name,
  logo,
  description,
  cityId: city_id,
  provinceId: province_id,
  districtId: district_id,
  address,
  latitude,
  longitude,
}: ICreateStoreServiceProps) => {
  const uploadLogo = async () => {
    const res: any = await cloudinaryUpload(logo?.buffer, "store/logo");

    return { imageUrl: res.secureUrl };
  };

  const logoCreate = await uploadLogo();

  const store = await prisma.store.create({
    data: {
      name,
      logo: logoCreate.imageUrl,
      description,
      cityId: city_id,
      provinceId: province_id,
      districtId: district_id,
      address,
      latitude,
      longitude,
      status: StoreStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      logo: true,
      description: true,
      address: true,
      latitude: true,
      longitude: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      province: {
        select: {
          id: true,
          name: true,
        },
      },
      city: {
        select: {
          id: true,
          name: true,
        },
      },
      district: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const formattedResponse = {
    ...store,
    latitude: Number(latitude),
    longitude: Number(longitude),
  };

  return snakecaseKeys(formattedResponse);
};

export const deleteStoreService = async ({ id }: Pick<Store, "id">) => {
  const store = await prisma.store.findUnique({
    where: {
      id,
    },
  });

  if (!store || store.deletedAt != null) {
    throw { message: "Store not found.", isExpose: true };
  }

  await prisma.store.update({
    where: {
      id,
    },
    data: {
      status: StoreStatus.INACTIVE,
      deletedAt: new Date(),
    },
  });
};

export const updateStoreService = async ({
  id,
  name,
  logo,
  description,
  cityId,
  provinceId,
  districtId,
  address,
  latitude,
  longitude,
  status,
}: IUpdateStoreServiceProps) => {
  const getStore = await prisma.store.findUnique({
    where: { id },
  });

  let logoCreate: LogoStore = { imageUrl: "" };
  if (logo) {
    const uploadLogo = async () => {
      const res: any = await cloudinaryUpload(logo.buffer, "store/logo");

      return { imageUrl: res.secureUrl };
    };

    logoCreate = await uploadLogo();
  } else {
    logoCreate.imageUrl = getStore?.logo;
  }

  const store = await prisma.store.update({
    where: { id },
    data: {
      name,
      logo: logoCreate.imageUrl,
      description: description ? description : getStore?.description,
      cityId: cityId ? cityId : getStore?.cityId,
      provinceId: provinceId ? provinceId : getStore?.provinceId,
      districtId: districtId ? districtId : getStore?.districtId,
      address: address ? address : getStore?.address,
      latitude: latitude ? latitude : getStore?.latitude,
      longitude: longitude ? longitude : getStore?.longitude,
      status: status ? status : getStore?.status,
    },
    select: {
      id: true,
      name: true,
      logo: true,
      description: true,
      address: true,
      latitude: true,
      longitude: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      province: {
        select: {
          id: true,
          name: true,
        },
      },
      city: {
        select: {
          id: true,
          name: true,
        },
      },
      district: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const formattedResponse = {
    ...store,
    latitude: Number(store.latitude),
    longitude: Number(store.longitude),
  };

  return snakecaseKeys(formattedResponse);
};

export const createAssignStoreAdminService = async ({
  id,
  userId,
}: ICreateAssignStoreAdminServiceProps) => {
  try {
    const store = await prisma.store.findUnique({
      where: {
        id,
      },
    });

    if (!store) {
      throw { message: "Store not found", isExpose: true };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        userRole: true,
      },
    });

    if (!user) {
      throw { message: "User not found", isExpose: true };
    }

    if (user.userRole != UserRole.ADMIN_STORE) {
      throw {
        message: "Invalid role. Only the Store Admin role can be assigned.",
        isExpose: true,
      };
    }

    const admin_store = await prisma.userStore.create({
      data: {
        userId: userId,
        storeId: id,
      },
      omit: {
        userId: true,
        storeId: true,
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      store_name: admin_store.store.name,
      full_name: admin_store.user.fullName,
    };
  } catch (error: any) {
    if (error?.code == "P2002") {
      throw {
        message: "Assignment failed. User is already assigned to this store.",
        isExpose: true,
      };
    }

    if (error?.isExpose) {
      throw { message: error?.message, isExpose: true };
    }

    throw { message: "Internal server error", isExpose: true };
  }
};

export const deleteStoreAdminService = async ({
  id,
  userId,
}: ICreateAssignStoreAdminServiceProps) => {
  const store = await prisma.store.findUnique({
    where: {
      id,
    },
  });

  if (!store) {
    throw { message: "Store not found", isExpose: true };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw { message: "User not found", isExpose: true };
  }

  await prisma.userStore.delete({
    where: {
      userId_storeId: {
        storeId: store.id,
        userId: user.id,
      },
    },
  });

  return {
    user: user.fullName,
    store: store.name,
  };
};
