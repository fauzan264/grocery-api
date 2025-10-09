import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 3,
  message: {
    success: false,
    message: "Too many requests, please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default limiter;
