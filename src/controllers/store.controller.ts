import { Request, Response } from "express";
import {
  createAssignStoreAdminService,
  createStoreService,
  deleteStoreService,
  getAllStoreService,
  getStoreByIdService,
  getStoreNearbyService,
  updateStoreService,
} from "../services/store.service";

export const getStoreNearbyController = async (req: Request, res: Response) => {
  const { latitude, longitude, radius } = req.query;
  const stores = await getStoreNearbyService({
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

export const getAllStoreController = async (req: Request, res: Response) => {
  let { name, province, city, district, status, page, limit } = req.query;

  const stores = await getAllStoreService({
    name: name ? String(name) : undefined,
    province: province ? String(province) : undefined,
    city: city ? String(city) : undefined,
    district: district ? String(district) : undefined,
    status: status ? String(status) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.status(200).json({
    success: true,
    message: "Successfully fetched list of stores",
    data: stores,
  });
};

export const getStoreByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;

  const store = await getStoreByIdService({ id });

  res.status(200).json({
    success: true,
    message: "Store details fetched successfully.",
    data: store,
  });
};

export const createStoreController = async (req: Request, res: Response) => {
  const {
    name,
    description,
    city_id,
    province_id,
    district_id,
    address,
    latitude,
    longitude,
  } = req.body;

  const logo = req.file;
  if (!logo) {
    throw { message: "Logo is required", isExpose: true };
  }

  const store = await createStoreService({
    name,
    logo,
    description,
    cityId: Number(city_id),
    provinceId: Number(province_id),
    districtId: Number(district_id),
    address,
    latitude,
    longitude,
  });

  res.status(201).json({
    success: true,
    message: "Store created successfully.",
    data: store,
  });
};

export const deleteStoreController = async (req: Request, res: Response) => {
  const { id } = req.params;

  await deleteStoreService({ id });

  res.status(200).json({
    success: true,
    message: "Store deleted successfully.",
  });
};

export const updateStoreController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    description,
    city_id,
    province_id,
    district_id,
    address,
    latitude,
    longitude,
    status,
  } = req.body;

  const logo = req.file ? req.file : undefined;

  const store = await updateStoreService({
    id,
    name,
    logo,
    description,
    cityId: Number(city_id),
    provinceId: Number(province_id),
    districtId: Number(district_id),
    address,
    latitude,
    longitude,
    status,
  });

  res.status(200).json({
    success: true,
    message: "Store updated successfully.",
    data: store,
  });
};

export const createAssignStoreAdminController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { user_id } = req.body;

  const { full_name, store_name } = await createAssignStoreAdminService({
    id,
    userId: user_id,
  });

  res.status(201).json({
    success: true,
    message: "User has been successfully assigned as Store Admin.",
    data: {
      store_name,
      full_name,
    },
  });
};
