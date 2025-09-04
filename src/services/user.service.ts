import snakecaseKeys from "snakecase-keys";
import { prisma } from "../db/connection";
import { User } from "../generated/prisma";

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
  });

  const responseFormatter = addresses.map((address: any) => {
    return snakecaseKeys(address);
  });

  return responseFormatter;
};

export const getMyAddressesByIDService = async ({
  id,
}: {
  id: string;
  storeId: string;
}) => {
  const address = await prisma.userAddress.findUnique({
    where: {
      userId: id,
      deletedAt: null,
    },
    omit: {
      deletedAt: true,
    },
  });

  if (!address) {
    throw { message: "Address not found", isExpose: true };
  }

  return address;
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
