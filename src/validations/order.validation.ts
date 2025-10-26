import * as yup from "yup";

export const createOrderSchema = yup.object({
  storeId: yup
    .string()
    .uuid("Invalid store ID format")
    .required("storeId is required"),

  couponCodes: yup
    .array()
    .of(yup.string().trim())
    .default([])
    .optional(),

  paymentMethod: yup
    .string()
    .oneOf(["BANK_TRANSFER","SNAP"] , "Invalid payment method")
    .required("Payment Method is required"),

  shipment: yup
    .object({
      courier: yup
        .string()
        .trim()
        .required("courier is required"),
      service: yup
        .string()
        .trim()
        .required("service is required"),
      shipping_cost: yup
        .number()
        .min(0, "shipping_cost must be a positive number")
        .required("shipping_cost is required"),
      shipping_days: yup
        .string() 
        .trim()
        .notRequired(),
    })
    .required("shipment is required"),
});
