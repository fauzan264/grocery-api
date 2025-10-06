import snakecaseKeys from "snakecase-keys";
import { prisma } from "../db/connection";
import { Store, StoreStatus } from "../generated/prisma";

export const getPublicStoreNearbyService = async ({
  latitude,
  longitude,
  radius,
}: {
  latitude: number | undefined;
  longitude: number | undefined;
  radius: number | undefined;
}) => {
  if (!latitude) {
    throw { message: "Latitude is required", isExpose: true };
  }

  if (!longitude) {
    throw { message: "Longitude is required", isExpose: true };
  }

  let radiusLocation = 15;
  if (radius) {
    radiusLocation = radius;
  }

  const stores = await prisma.$queryRaw`select s.id,
      (6371 * acos(
        cos(radians(${latitude})) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(s.latitude))
      )) as distance
    from stores s 
    where (6371 * acos(
      cos(radians(${latitude})) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(${longitude})) +
      sin(radians(${latitude})) * sin(radians(s.latitude))
    )) <= ${radiusLocation}
    order by distance asc
    limit 1`;

  return stores;
};

export const getPublicStoreByIdService = async ({ id }: Pick<Store, "id">) => {
  const store = await prisma.store.findUnique({
    where: {
      id,
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
