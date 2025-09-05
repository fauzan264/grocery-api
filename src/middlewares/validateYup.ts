import { Request, Response, NextFunction } from "express";
import { AnySchema } from "yup";

export const validateYup = (schema: AnySchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.validate(
        {
          body: req.body,
          params: req.params,
          query: req.query,
        },
        { abortEarly: false, stripUnknown: true }
      );

      if (validated && (validated as any).body) {
        req.body = (validated as any).body;
      }
      return next();
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors || err.message,
      });
    }
  };
};
