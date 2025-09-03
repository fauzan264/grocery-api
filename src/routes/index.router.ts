import { Router } from "express";
import authRouter from "./auth.router";
import userRouter from "./user.router";

const mainRouter = Router();

mainRouter.use("/api/auth", authRouter);
mainRouter.use("/api/user", userRouter);

export default mainRouter;
