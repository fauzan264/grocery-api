import * as yup from "yup";

export const addToCartSchema = yup.object({
    productId : yup
    .string()
    .uuid("Invalid product ID format")
    .required("product ID is required"),
    quantity: yup
    .number()
    .integer("Invalid product ID format")
    .required("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .default(1)
    .required("Quantity is required")
})

export const updateCartItemSchema = yup.object({
  id: yup
    .string()
    .uuid("Invalid cart item ID format")
    .required("id (cart item ID) is required"),
  action: yup
    .string()
    .oneOf(["increment", "decrement"], "Action must be either 'increment' or 'decrement'")
    .required("action is required"),
});