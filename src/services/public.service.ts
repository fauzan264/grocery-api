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

export const getPublicProductsService = async ({
  storeId = "",
  page,
  limit,
}: {
  storeId?: string;
  page?: number | undefined;
  limit?: number | undefined;
}) => {
  const where: any = {
    product: {
      images: {
        some: {
          isPrimary: true,
        },
      },
    },
  };

  if (storeId) {
    where.storeId = {
      contains: storeId,
    };
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.max(Number(limit) || 10, 1);
  const offset = (pageNumber - 1) * limitNumber;

  const totalData = await prisma.stock.count({
    where: Object.keys(where).length > 0 ? where : undefined,
  });

  const totalPages = Math.ceil(totalData / limitNumber);

  const products = await prisma.stock.findMany({
    where: where,
    skip: offset,
    take: limitNumber,
    select: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          images: {
            select: {
              url: true,
            },
          },
        },
      },
      quantity: true,
    },
  });

  const responseFormatter = products.map((product) => {
    return {
      id: product.product.id,
      name: product.product.name,
      price: Number(product.product.price),
      image: product.product.images[0].url,
      stock: product.quantity,
    };
  });

  const response = {
    products: responseFormatter,
    pagination: {
      current_page: pageNumber,
      per_page: limitNumber,
      total_data: totalData,
      total_page: totalPages,
    },
  };

  return snakecaseKeys(response, { deep: true });
};

export const getPublicProductByIDService = async ({ id }: { id: string }) => {
  const product = await prisma.stock.findFirst({
    where: {
      product: {
        id,
      },
    },
    select: {
      product: {
        select: {
          id: true,
          name: true,
          description: true,
          weight_g: true,
          price: true,
          images: {
            select: {
              url: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      },
      quantity: true,
    },
  });

  if (!product) {
    throw { message: "Product Not Found", isExpose: true };
  }

  const responseFormatter = {
    id: product?.product.id,
    name: product?.product.name,
    description: product?.product.description,
    weight: product?.product.weight_g,
    price: Number(product?.product.price),
    image: product?.product.images[0].url,
    category: product?.product.category?.name,
    stock: product?.quantity,
  };

  return snakecaseKeys(responseFormatter);
};
