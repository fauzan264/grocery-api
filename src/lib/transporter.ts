import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "fauzan.c4@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});
