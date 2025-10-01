import { prisma } from "../db/connection";

export const provincesShippingService = async () => {
  const provinces = await prisma.province.findMany();

  return provinces;
};

export const provincesByIdShippingService = async ({ id }: { id: number }) => {
  const province = await prisma.province.findUnique({
    where: {
      id,
    },
  });

  if (!province) {
    throw { message: "Province not found.", isExpose: true };
  }

  return province;
};

export const citiesShippingService = async ({
  provinceId,
  id,
  name,
}: {
  provinceId: number;
  id?: number;
  name?: string | undefined;
}) => {
  const province = await prisma.province.findUnique({
    where: {
      id: provinceId,
    },
  });

  if (!province) {
    throw { message: "Province not found.", isExpose: true };
  }

  const where: any = {
    provinceId,
  };

  if (id) {
    where.id = {
      equals: id,
    };
  }

  if (name && name != "undefined") {
    where.name = {
      contains: name,
      mode: "insensitive",
    };
  }

  const cities = await prisma.city.findMany({
    where,
    select: {
      id: true,
      name: true,
    },
  });

  return cities;
};

export const districtsShippingService = async ({
  cityId,
  id,
  name,
}: {
  cityId: number;
  id?: number;
  name?: string | undefined;
}) => {
  const city = await prisma.city.findUnique({
    where: {
      id: cityId,
    },
  });

  if (!city) {
    throw { message: "City not found.", isExpose: true };
  }

  const where: any = {
    cityId,
  };
  if (id) {
    where.id = {
      equals: id,
    };
  }

  if (name && name != "undefined") {
    where.name = {
      contains: name,
      mode: "insensitive",
    };
  }

  const districts = await prisma.district.findMany({
    where,
    select: {
      id: true,
      name: true,
    },
  });

  return districts;
};
