import { Request, Response, NextFunction } from "express";
import { AnySchema, ValidationError } from "yup";

export const validateYup = (
  schema: AnySchema,
  source: "body" | "params" | "query" = "body"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = {
        ...req[source],
        ...(req.file && { file: req.file }),
        ...(req.files && { files: req.files }),
      };

      const validated = await schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
      });

      req[source] = validated;
      return next();
    } catch (err: any) {
      if (err instanceof ValidationError) {
        const errorArray = err.inner.map((error: any) => ({
          field: error.path,
          message: error.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: errorArray,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors || err.message,
      });
    }
  };
};
