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
  authValidateController,
  authVerificationChangeEmailController,
  authVerificationEmailController,
} from "../controllers/auth.controller";
import { jwtVerify } from "../middlewares/jwt.verify";
import limiter from "../middlewares/rate.limiter";
import { validateYup } from "../middlewares/validateYup";
import {
  authChangeEmailSchema,
  authChangePasswordSchema,
  authLoginSchema,
  authRegisterSchema,
  authRequestResetPasswordSchema,
  authResendRegisterVerificationSchema,
  authResetPasswordSchema,
  authVerificationEmailSchema,
} from "../validations/auth.validation";

const authRouter = Router();

authRouter.post(
  "/register",
  validateYup(authRegisterSchema),
  authRegisterController
);
authRouter.post(
  "/verify-email",
  jwtVerify,
  validateYup(authVerificationEmailSchema),
  authVerificationEmailController
);
authRouter.post("/login", validateYup(authLoginSchema), authLoginController);
authRouter.post(
  "/request-reset-password",
  validateYup(authRequestResetPasswordSchema),
  authRequestResetPasswordController
);
authRouter.post(
  "/reset-password",
  jwtVerify,
  validateYup(authResetPasswordSchema),
  authResetPasswordController
);
authRouter.post(
  "/change-password",
  jwtVerify,
  validateYup(authChangePasswordSchema),
  authChangePasswordController
);
authRouter.get("/session", jwtVerify, authSessionLoginController);
authRouter.get("/google", authGoogleController);
authRouter.get("/google/callback", authGoogleCallbackController);
authRouter.post(
  "/email/change",
  jwtVerify,
  validateYup(authChangeEmailSchema),
  authChangeEmailController
);
authRouter.post(
  "/email/verify-email",
  jwtVerify,
  authVerificationChangeEmailController
);
authRouter.post(
  "/register/resend-verification",
  limiter,
  validateYup(authResendRegisterVerificationSchema),
  authResendRegisterVerificationController
);
authRouter.post(
  "/email/resend-verification",
  limiter,
  jwtVerify,
  authResendEmailVerificationController
);
authRouter.post("/validate", jwtVerify, authValidateController);

export default authRouter;
