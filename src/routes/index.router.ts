import { Router } from "express";
import authRouter from "./auth.router";
import userRouter from "./user.router";
import storeRouter from "./store.router";

const mainRouter = Router();

mainRouter.use("/api/auth", authRouter);
mainRouter.use("/api/users", userRouter);
mainRouter.use("/api/stores", storeRouter);

export default mainRouter;
