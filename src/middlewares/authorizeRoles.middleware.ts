import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const authorizeRoles = (...roles: ("SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER")[]) => {
  const allowed = roles.map(r => r.toUpperCase());
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userRole = String(req.user.role).toUpperCase();
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden: Insufficient role" });
    }

    return next();
  };
};
