import { Request, Response } from "express";
import {
  getPublicStoreByIdService,
  getPublicStoreNearbyService,
} from "../services/public.service";

export const getPublicStoreNearbyController = async (
  req: Request,
  res: Response
) => {
  const { latitude, longitude, radius } = req.query;
  const stores = await getPublicStoreNearbyService({
    latitude: latitude ? Number(latitude) : undefined,
    longitude: latitude ? Number(longitude) : undefined,
    radius: radius ? Number(radius) : undefined,
  });

  res.status(200).json({
    status: true,
    message: "Store nearby fetched successfully.",
    data: stores,
  });
};

export const getPublicStoreByIdController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  const store = await getPublicStoreByIdService({ id });

  res.status(200).json({
    success: true,
    message: "Store details fetched successfully.",
    data: store,
  });
};
