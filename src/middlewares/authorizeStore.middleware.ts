import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const authorizeStore = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // SUPER_ADMIN boleh lewati cek toko
  if (req.user.role === "SUPER_ADMIN") return next();

  // ADMIN_STORE harus punya storeId yang match
  const { storeId } = req.body; // asumsi storeId dikirim di body

  if (!storeId || !req.user.stores?.includes(storeId)) {
    return res.status(403).json({ success: false, message: "Forbidden: Invalid store access" });
  }

  next();
};
