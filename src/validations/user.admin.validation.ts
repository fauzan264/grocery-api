import * as yup from "yup";

export const createUserAdminSchema = yup.object({
  fullName: yup.string().required("fullName is required").max(100),
  email: yup.string().email("Invalid email").required("email is required"),
  dateOfBirth: yup
    .date()
    .nullable()
    .transform((v, o) => (o === "" ? null : v)),
  phoneNumber: yup
    .string()
    .nullable()
    .matches(/^[0-9+ -]{6,15}$/, "Invalid phone number")
    .notRequired(),
  userRole: yup
    .string()
    .oneOf(["ADMIN_STORE", "CUSTOMER", "SUPER_ADMIN"])
    .required("userRole is required"),
  password: yup.string().when("userRole", {
    is: (val: string) => val === "ADMIN_STORE",
    then: (schema) =>
      schema.required("Password is required for ADMIN_STORE").min(6),
    otherwise: (schema) => schema.notRequired(),
  }),
  photoProfile: yup.string().nullable().notRequired(),
});

export const updateUserAdminSchema = yup.object({
  fullName: yup.string().optional().max(100),
  phoneNumber: yup
    .string()
    .nullable()
    .matches(/^[0-9+ -]{6,15}$/, "Invalid phone number")
    .notRequired(),
  status: yup.string().oneOf(["ACTIVE", "INACTIVE"]).notRequired(),
  password: yup.string().min(6).notRequired(),
  photoProfile: yup.string().nullable().notRequired(),
});
