import { UserAddress } from "../generated/prisma";

export interface IGetMyAddressesByIDServiceProps {
  addressId: string;
  userId: string;
}

export interface ICreateAddressesServiceProps
  extends Pick<
    UserAddress,
    "city" | "province" | "subdistrict" | "address" | "latitude" | "longitude"
  > {
  userId: string;
}

export interface IUpdateAddressesServiceProps
  extends Pick<
    UserAddress,
    "city" | "province" | "subdistrict" | "address" | "latitude" | "longitude"
  > {
  addressId: string;
  userId: string;
}

export interface IDeleteAddressesServiceProps {
  addressId: string;
  userId: string;
}
