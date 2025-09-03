import { Request, Response } from "express";
import {
  authRegisterService,
  authVerificationEmailService,
} from "../services/auth.service";

export const authRegisterController = async (req: Request, res: Response) => {
  const { full_name, date_of_birth, email, phone_number } = req.body;

  const user = await authRegisterService({
    fullName: full_name,
    dateOfBirth: date_of_birth,
    email: email,
    phoneNumber: phone_number,
  });

  res.status(200).json({
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
  const { userId } = res.locals.payload;

  const { full_name, email } = await authVerificationEmailService({
    id: userId,
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
