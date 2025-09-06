import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET_KEY || "mysecret"; // samain sama .env kamu

// payload sesuai authMiddleware
const payload = {
  sub: "user-123", // user id
  role: "SUPER_ADMIN", // bisa ganti ke ADMIN_STORE atau CUSTOMER
  stores: ["store-1", "store-2"], // opsional
};

// token expire dalam 1 jam
const token = jwt.sign(payload, secret, { expiresIn: "1h" });

console.log("Generated JWT:\n");
console.log(token);
