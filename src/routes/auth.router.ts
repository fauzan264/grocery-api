import { Router } from "express";
import {
  authChangePasswordController,
  authGoogleCallbackController,
  authGoogleController,
  authLoginController,
  authRegisterController,
  authRequestResetPasswordController,
  authResetPasswordController,
  authSessionLoginController,
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
authRouter.get("/session", jwtVerify, authSessionLoginController);
authRouter.get("/google", authGoogleController);
authRouter.get("/google/callback", authGoogleCallbackController);

export default authRouter;
