import { Request, Response } from "express";
import {
  getMyAddressesByIDService,
  getMyAddressesService,
  getMyProfileService,
  getMyStoreService,
} from "../services/user.service";

export const getMyProfileController = async (req: Request, res: Response) => {
  const { user_id } = res.locals.payload;

  const user = await getMyProfileService({ id: user_id });

  res.status(200).json({
    success: true,
    message: "Successfully fetched your profile.",
    data: user,
  });
};

export const getMyAddressesController = async (req: Request, res: Response) => {
  const { user_id } = res.locals.payload;

  const addresses = await getMyAddressesService({ id: user_id });

  res.status(200).json({
    status: true,
    message: "Successfully fetched your list of address.",
    data: addresses,
  });
};

export const getMyAddressesByIDController = async (
  req: Request,
  res: Response
) => {
  const { user_id } = res.locals.payload;
  const { storeId } = req.params;

  const address = await getMyAddressesByIDService({ id: user_id, storeId });

  res.status(200).json({
    status: true,
    message: "Successfully fetched your detail address.",
    data: address,
  });
};

export const getMyStoreController = async (req: Request, res: Response) => {
  const { user_id } = res.locals.payload;

  const store = await getMyStoreService({ id: user_id });

  res.status(200).json({
    status: true,
    message: "Successfully fetched your store.",
    data: store,
  });
};
