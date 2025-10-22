import * as yup from "yup";

export const authRegisterSchema = yup.object().shape({
  full_name: yup.string().required("Full Name is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email address is required"),
  phone_number: yup.string().required("Phone Number is required"),
});

export const authVerificationEmailSchema = yup.object().shape({
  password: yup.string().required("Password is required"),
});

export const authLoginSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("Email address is required"),
  password: yup.string().required("Password is required"),
});

export const authRequestResetPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("Email address is required"),
});

export const authResetPasswordSchema = yup.object().shape({
  password: yup.string().required("Password is required"),
});

export const authChangePasswordSchema = yup.object().shape({
  old_password: yup.string().required("Old Password is required"),
  new_password: yup.string().required("New Password is required"),
});

export const authChangeEmailSchema = yup.object().shape({
  new_email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("New Email is required"),
  password: yup.string().required("Password is required"),
});

export const authResendRegisterVerificationSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("Email address is required"),
});
