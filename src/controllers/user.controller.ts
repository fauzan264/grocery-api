import { Request, Response } from "express";
import {
  getMyAddressesByIDService,
  getMyAddressesService,
  getMyProfileService,
  getMyStoreService,
} from "../services/user.service";

//admin service
import {createUserAdminService,
  listUsersAdminService,
  getUserAdminByIdService,
  updateUserAdminService,
  deleteUserAdminService,
} from "../services/user.superAdmin.service"

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

// Create user SUPER_ADMIN

export const createUserAdminController = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const created = await createUserAdminService(payload);
    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: created,
    });
  } catch (err: any) {
    console.error("createUserAdminController:", err);
    const status = err?.isExpose ? 400 : 500;
    return res.status(status).json({ success: false, message: err?.message || "Failed to create user" });
  }
};

/* List users (SUPER_ADMIN) */
export const listUsersAdminController = async (req: Request, res: Response) => {
  try {
    const { role, page = "1", limit = "20", q } = req.query;
    const result = await listUsersAdminService({
      role: role as string | undefined,
      page: Number(page),
      limit: Number(limit),
      q: q as string | undefined,
    });
    return res.status(200).json({ success: true, message: "Users fetched", data: result });
  } catch (err: any) {
    console.error("listUsersAdminController:", err);
    return res.status(500).json({ success: false, message: err?.message || "Failed to list users" });
  }
};

/* Get user by id (SUPER_ADMIN) */
export const getUserAdminByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getUserAdminByIdService({ id });
    return res.status(200).json({ success: true, message: "User fetched", data: user });
  } catch (err: any) {
    console.error("getUserAdminByIdController:", err);
    const status = err?.isExpose ? 404 : 500;
    return res.status(status).json({ success: false, message: err?.message || "Failed to fetch user" });
  }
};

/* Update user (SUPER_ADMIN) */
export const updateUserAdminController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updated = await updateUserAdminService({ id, payload });
    return res.status(200).json({ success: true, message: "User updated", data: updated });
  } catch (err: any) {
    console.error("updateUserAdminController:", err);
    const status = err?.isExpose ? 400 : 500;
    return res.status(status).json({ success: false, message: err?.message || "Failed to update user" });
  }
};

/* Soft delete user (SUPER_ADMIN) */
export const deleteUserAdminController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteUserAdminService({ id });
    return res.status(200).json({ success: true, message: "User soft-deleted" });
  } catch (err: any) {
    console.error("deleteUserAdminController:", err);
    const status = err?.isExpose ? 400 : 500;
    return res.status(status).json({ success: false, message: err?.message || "Failed to delete user" });
  }
};
