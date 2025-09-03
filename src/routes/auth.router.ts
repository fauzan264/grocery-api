import { Router } from "express";
import {
  authLoginController,
  authRegisterController,
  authVerificationEmailController,
} from "../controllers/auth.controller";
import { jwtVerify } from "../middlewares/jwt.verify";

const authRouter = Router();

authRouter.post("/register", authRegisterController);
authRouter.post("/verify-email", jwtVerify, authVerificationEmailController);
authRouter.post("/login", authLoginController);

export default authRouter;
