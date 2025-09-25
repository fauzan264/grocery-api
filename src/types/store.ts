import { Store } from "../generated/prisma";

export type LogoStore = { imageUrl: string | undefined };

export interface IGetAllStoreServiceProps {
  name?: string | undefined;
  province?: string | undefined;
  city?: string | undefined;
  district?: string | undefined;
  status?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface ICreateStoreServiceProps
  extends Pick<
    Store,
    | "name"
    | "description"
    | "cityId"
    | "provinceId"
    | "districtId"
    | "address"
    | "latitude"
    | "longitude"
  > {
  logo: Express.Multer.File;
}

export interface IUpdateStoreServiceProps
  extends Pick<
    Store,
    | "id"
    | "name"
    | "description"
    | "cityId"
    | "provinceId"
    | "districtId"
    | "address"
    | "latitude"
    | "longitude"
    | "status"
  > {
  logo?: Express.Multer.File;
}

export interface ICreateAssignStoreAdminServiceProps {
  id: string;
  userId: string;
}
