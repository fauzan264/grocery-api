import { Router } from "express";
import authRouter from "./auth.router";
import userRouter from "./user.router";
import storeRouter from "./store.router";
import cartRouter from "./cart.router";

const mainRouter = Router();

mainRouter.use("/api/auth", authRouter);
mainRouter.use("/api/users", userRouter);
mainRouter.use("/api/stores", storeRouter);
mainRouter.use("/api/cart", cartRouter)

export default mainRouter;
