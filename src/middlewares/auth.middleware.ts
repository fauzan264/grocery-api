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

function normalizeRole(raw?: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw.toUpperCase();
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") return (raw[0] as string).toUpperCase();
  return undefined;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT secret missing");
    return res.status(500).json({ success: false, message: "Server misconfiguration" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string") {
      // unexpected token shape
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    const payload = decoded as JwtPayload & Record<string, unknown>;

    if (process.env.NODE_ENV !== "production") {
      console.log("Decoded JWT payload:", payload);
    }

    // extract subject
    const subCandidate = payload.sub ?? payload.userId ?? payload.id ?? payload["user_id"];
    if (!subCandidate || typeof subCandidate !== "string") {
      return res.status(401).json({ success: false, message: "Invalid token payload: missing subject" });
    }

    // normalize role (accept payload.role or payload.roles)
    const rawRole = payload.role ?? payload.roles ?? payload["roleName"];
    const role = normalizeRole(rawRole);
    const allowedRoles = ["SUPER_ADMIN", "ADMIN_STORE", "CUSTOMER"];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, message: "Invalid role in token" });
    }

    // normalize stores field if present
    const storesRaw = payload.stores ?? payload.storeIds ?? payload["stores_ids"];
    const stores = Array.isArray(storesRaw) ? storesRaw.map(s => String(s)) : undefined;

    req.user = {
      sub: subCandidate,
      role: role as "SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER",
      stores,
    };

    return next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
