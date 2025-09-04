import { Router } from "express";
import {
  authChangePasswordController,
  authLoginController,
  authRegisterController,
  authRequestResetPasswordController,
  authResetPasswordController,
  authVerificationEmailController,
} from "../controllers/auth.controller";
import { jwtVerify } from "../middlewares/jwt.verify";

const authRouter = Router();

authRouter.post("/register", authRegisterController);
authRouter.post("/verify-email", jwtVerify, authVerificationEmailController);
authRouter.post("/login", authLoginController);
authRouter.post("/request-reset-password", authRequestResetPasswordController);
authRouter.post("/reset-password", jwtVerify, authResetPasswordController);
authRouter.post("/change-password", jwtVerify, authChangePasswordController);

export default authRouter;
