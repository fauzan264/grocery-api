import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";


export function ensureRole(role: "SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER") {
return (req: AuthRequest, res: Response, next: NextFunction) => {
if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
if (req.user.role !== role) return res.status(403).json({ success: false, message: "Forbidden" });
next();
};
}


export function ensureStoreOwnership(req: AuthRequest, res: Response, next: NextFunction) {
const storeId = req.params.storeId as string || req.body.storeId as string;
if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
if (req.user.role === "SUPER_ADMIN") return next();
if (req.user.role === "ADMIN_STORE") {
const stores = req.user.stores || [];
if (!storeId) return res.status(400).json({ success: false, message: "storeId required" });
if (!stores.includes(storeId)) return res.status(403).json({ success: false, message: "You don't manage this store" });
return next();
}
return res.status(403).json({ success: false, message: "Forbidden" });
}