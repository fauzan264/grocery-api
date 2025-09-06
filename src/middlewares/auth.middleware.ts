import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { Request } from "express";


export interface AuthRequest extends Request {
user?: {
sub: string;
role: "SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER";
stores?: string[];
};
}


export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
const authHeader = req.headers.authorization;
if (!authHeader) return res.status(401).json({ success: false, message: "No token" });
const token = authHeader.split(" ")[1];
if (!token) return res.status(401).json({ success: false, message: "No token" });


try {
const secret = process.env.JWT_SECRET as string;
const payload = jwt.verify(token, secret) as { sub: string; role: string; stores?: string[] };
req.user = { sub: payload.sub, role: payload.role as "SUPER_ADMIN" | "ADMIN_STORE" | "CUSTOMER", stores: payload.stores };
next();
} catch (err) {
return res.status(401).json({ success: false, message: "Invalid token" });
}
};