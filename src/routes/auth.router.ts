import { Router } from "express";
import {
  authRegisterController,
  authVerificationEmailController,
} from "../controllers/auth.controller";
import { jwtVerify } from "../middlewares/jwt.verify";

const authRouter = Router();

authRouter.post("/register", authRegisterController);
authRouter.post("/verify-email", jwtVerify, authVerificationEmailController);

export default authRouter;
