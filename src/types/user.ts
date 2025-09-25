import { User, UserAddress } from "../generated/prisma";

export type PhotoProfile = { imageUrl: string | undefined | null };

export interface IGetMyAddressesByIDServiceProps {
  addressId: string;
  userId: string;
}

export interface ICreateAddressesServiceProps
  extends Pick<
    UserAddress,
    | "cityId"
    | "provinceId"
    | "districtId"
    | "address"
    | "latitude"
    | "longitude"
    | "isDefault"
  > {
  userId: string;
}

export interface IUpdateAddressesServiceProps
  extends Pick<
    UserAddress,
    | "cityId"
    | "provinceId"
    | "districtId"
    | "address"
    | "latitude"
    | "longitude"
    | "isDefault"
  > {
  addressId: string;
  userId: string;
}

export interface IDeleteAddressesServiceProps {
  addressId: string;
  userId: string;
}

export interface IUpdateMyProfileServiceProps
  extends Pick<
    User,
    "id" | "fullName" | "dateOfBirth" | "email" | "phoneNumber"
  > {
  photoProfile?: Express.Multer.File;
}
