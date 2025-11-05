import { Request, Response } from "express";
import {
  createAssignStoreAdminService,
  createStoreService,
  deleteStoreAdminService,
  deleteStoreService,
  getAllAdminStoreService,
  getAllStoreService,
  getStoreByIdService,
  updateStoreService,
} from "../services/store.service";
import { camelCase } from "text-camel-case";

export const getAllStoreController = async (req: Request, res: Response) => {
  let {
    name,
    province,
    province_id,
    city,
    district,
    status,
    page,
    limit,
    sort_by,
    sort_order,
  } = req.query;

  const stores = await getAllStoreService({
    name: name ? String(name) : undefined,
    province: province ? String(province) : undefined,
    provinceId: province_id ? Number(province_id) : undefined,
    city: city ? String(city) : undefined,
    district: district ? String(district) : undefined,
    status: status ? String(status) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sort_by ? camelCase(String(sort_by)) : undefined,
    sortOrder:
      sort_order === "asc" || sort_order === "desc" ? sort_order : undefined,
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

export const deleteStoreAdminController = async (
  req: Request,
  res: Response
) => {
  const { id, userId } = req.params;

  const { user, store } = await deleteStoreAdminService({ id, userId });

  res.status(200).json({
    success: true,
    message: `Successfully removed admin '${user}' from store '${store}'.`,
  });
};

export const getAllAdminStoreController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { name, page, limit } = req.query;

  const store_admins = await getAllAdminStoreService({
    id,
    name: name ? String(name) : undefined,
    page: page ? Number(page) : undefined,
    limit: page ? Number(limit) : undefined,
  });

  res.status(200).json({
    success: true,
    message: "Successfully fetched list of stores",
    data: store_admins,
  });
};
