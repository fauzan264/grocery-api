import { Request, Response } from "express";
import {
  getPublicProductByIDService,
  getPublicProductsService,
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

export const getPublicProductsController = async (
  req: Request,
  res: Response
) => {
  const { store_id, page, limit } = req.query;

  const products = await getPublicProductsService({
    storeId: store_id as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.status(200).json({
    success: true,
    message: "Products fetched successfully.",
    data: products,
  });
};

export const getPublicProductByIDController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  const product = await getPublicProductByIDService({ id });

  res.status(200).json({
    success: true,
    message: "Product detail fetched successfully.",
    data: product,
  });
};
