import expres, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";

const app: Express = expres();
app.use(expres.json());
app.use(cors());
const port = 4000;

// app.use(mainRouter)

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.log(error);
  res.status(500).json({
    success: false,
    message: error?.isExpose ? error?.message : "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`⚡️ Server is running on port ${port}`);
});
