import { NextFunction, Request, Response } from "express";

export const roleVerify = (authorizeRole: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role } = res.locals.payload;

    if (!authorizeRole.includes(role)) {
      throw { isExpose: true, message: "Unauthorized user role" };
    }
    next();
  };
};
