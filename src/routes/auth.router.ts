import { Router } from "express";
import {
  authChangeEmailController,
  authChangePasswordController,
  authGoogleCallbackController,
  authGoogleController,
  authLoginController,
  authRegisterController,
  authRequestResetPasswordController,
  authResendEmailVerificationController,
  authResendRegisterVerificationController,
  authResetPasswordController,
  authSessionLoginController,
  authVerificationEmailController,
} from "../controllers/auth.controller";
import { jwtVerify } from "../middlewares/jwt.verify";
import limiter from "../middlewares/rate.limiter";

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
authRouter.post("/email/change", jwtVerify, authChangeEmailController);
authRouter.post("/verify-email", jwtVerify, authVerificationEmailController);
authRouter.post(
  "/register/resend-verification",
  limiter,
  authResendRegisterVerificationController
);
authRouter.post(
  "/email/resend-verification",
  limiter,
  jwtVerify,
  authResendEmailVerificationController
);

export default authRouter;
