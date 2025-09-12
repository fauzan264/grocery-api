import { Router } from "express";
import authRouter from "./auth.router";
import userRouter from "./user.router";
import storeRouter from "./store.router";
import cartRouter from "./cart.router";
import orderRouter from "./order.router";
import paymentRouter from "./payment.router";
import orderAdminRouter from "./orderAdmin.router";
import productRouter from "./routes.products";
import categoryRouter from "./routes.categories";



const mainRouter = Router();

mainRouter.use("/api/auth", authRouter);
mainRouter.use("/api/users", userRouter);
mainRouter.use("/api/stores", storeRouter);

//Order
mainRouter.use("/api/cart", cartRouter);
mainRouter.use("/api/orders", orderRouter);
mainRouter.use("/api/payment",paymentRouter);

//Order (Admin)
mainRouter.use("/api/admin", orderAdminRouter);

//Product
mainRouter.use("/api/products", productRouter);
mainRouter.use("/api/categories", categoryRouter);

export default mainRouter;
