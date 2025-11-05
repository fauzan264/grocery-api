import express, { Express, Request, Response, NextFunction } from "express";
import mainRouter from "./routes/index.router";
import cors from "cors";
import dotenv from "dotenv";
import { expiryTransactionSchedule } from "./jobs/cron/expiry.transaction.schedule";
import { confirmTransactionSchedule } from "./jobs/cron/confirm.transaction.schedule";
import { errorHandler } from "./middlewares/error.handler";

dotenv.config();

const app: Express = express();
app.use(express.json());
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") || [];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
const port = 4000;

app.use(mainRouter);

app.use(errorHandler);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.log(error);
  res.status(500).json({
    success: false,
    message: error?.isExpose ? error?.message : "Internal server error",
  });
});

expiryTransactionSchedule();
confirmTransactionSchedule();

app.listen(port, () => {
  console.log(`⚡️ Server is running on port ${port}`);
});
