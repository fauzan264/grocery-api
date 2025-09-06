import { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    role: "SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER";
    stores?: string[];
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Pastikan format: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET_KEY as string;
    const payload = jwt.verify(token, secret) as JwtPayload & {
      sub: string;
      role: string;
      stores?: string[];
    };

    // Debug log hanya saat development
    if (process.env.NODE_ENV !== "production") {
      console.log("Decoded JWT:", payload);
    }

    // Validasi role
    const validRoles = ["SUPER_ADMIN", "ADMIN_STORE", "CUSTOMER"] as const;
    if (!validRoles.includes(payload.role as any)) {
      return res.status(403).json({ success: false, message: "Invalid role" });
    }

    // Mapping ke req.user
    req.user = {
      sub: payload.sub,
      role: payload.role as "SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER",
      stores: payload.stores,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
