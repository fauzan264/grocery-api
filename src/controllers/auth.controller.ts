import { Request, Response } from "express";
import {
  authChangeEmailService,
  authChangePasswordService,
  authGoogleCallbackService,
  authLoginService,
  authRegisterService,
  authRequestResetPasswordService,
  authResendEmailVerificationService,
  authResendRegisterVerificationService,
  authResetPasswordService,
  authSessionLoginService,
  authVerificationChangeEmailService,
  authVerificationEmailService,
} from "../services/auth.service";
import { oauth2Client, authorizationUrl } from "../lib/auth.google";
import { google } from "googleapis";

export const authRegisterController = async (req: Request, res: Response) => {
  const { full_name, date_of_birth, email, phone_number } = req.body;

  const user = await authRegisterService({
    fullName: full_name,
    email: email,
    phoneNumber: phone_number,
  });

  res.status(201).json({
    success: true,
    message: "Register user successful",
    data: {
      full_name: user?.full_name,
      email: user?.email,
    },
  });
};

export const authVerificationEmailController = async (
  req: Request,
  res: Response
) => {
  const { password } = req.body;
  const { user_id } = res.locals.payload;

  const { full_name, email } = await authVerificationEmailService({
    id: user_id,
    password,
  });

  res.status(200).json({
    success: true,
    message:
      "Your email has been successfully verified. You can now login to your account.",
    data: {
      full_name,
      email,
    },
  });
};

export const authLoginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { token, full_name, role } = await authLoginService({
    email,
    password,
  });

  res.status(200).json({
    success: true,
    message: `Login user successful`,
    data: { token, full_name, role },
  });
};

export const authRequestResetPasswordController = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  await authRequestResetPasswordService({ email });

  res.status(200).json({
    success: true,
    message: "Password reset link has been sent to your email address.",
  });
};

export const authResetPasswordController = async (
  req: Request,
  res: Response
) => {
  const { password } = req.body;
  const { user_id } = res.locals.payload;

  await authResetPasswordService({ id: user_id, password });

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
};

export const authChangePasswordController = async (
  req: Request,
  res: Response
) => {
  const { old_password, new_password } = req.body;
  const { user_id } = res.locals.payload;

  await authChangePasswordService({
    oldPassword: old_password,
    newPassword: new_password,
    userId: user_id,
  });

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

export const authSessionLoginController = async (
  req: Request,
  res: Response
) => {
  const { user_id } = res.locals.payload;

  const { id, full_name, role } = await authSessionLoginService({
    id: user_id,
  });

  res.status(200).json({
    success: true,
    message: "Session data retrieved successfully.",
    data: { id, full_name, role },
  });
};

export const authGoogleController = async (req: Request, res: Response) => {
  res.redirect(authorizationUrl);
};

export const authGoogleCallbackController = async (
  req: Request,
  res: Response
) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.LINK_AUTH_LOGIN}`);
  }

  const { tokens } = await oauth2Client.getToken(code as string);

  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();

  if (!data.email || !data.name) {
    res.redirect(`${process.env.LINK_AUTH_LOGIN}`);
    throw { message: "Email is invalid or not found", isExpose: true };
  }

  const result = await authGoogleCallbackService({
    email: data.email,
    fullName: data.name,
    photoProfile: data.picture ? data.picture : "",
  });

  if (!result.success && result.reason == "EMAIL_REGISTERED_LOCAL") {
    res.redirect(
      `${process.env.LINK_AUTH_LOGIN}?error=email_already_registered`
    );
  }

  res.redirect(`${process.env.LINK_AUTH_LOGIN}?token=${result.token}`);
};

export const authChangeEmailController = async (
  req: Request,
  res: Response
) => {
  const { new_email, password } = req.body;
  const { id } = res.locals.payload;

  await authChangeEmailService({
    new_email,
    id,
    password,
  });

  res.status(200).json({
    success: true,
    message:
      "Email changed successfully. Check your inbox to verify your new email.",
  });
};

export const authVerificationChangeEmailController = async (
  req: Request,
  res: Response
) => {
  const { user_id } = res.locals.payload;

  const { full_name, email } = await authVerificationChangeEmailService({
    id: user_id,
  });

  res.status(200).json({
    success: true,
    message: "Your email has been successfully verified.",
    data: {
      full_name,
      email,
    },
  });
};

export const authResendRegisterVerificationController = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  await authResendRegisterVerificationService({ email });

  res.status(200).json({
    success: true,
    message: "Verification email has been resent. Please check your email.",
  });
};

export const authResendEmailVerificationController = async (
  req: Request,
  res: Response
) => {
  const { user_id } = res.locals.payload;
  await authResendEmailVerificationService({ id: user_id });

  res.status(200).json({
    success: true,
    message: "Verification email has been resent. Please check your email.",
  });
};
