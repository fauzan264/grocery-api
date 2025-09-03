import Handlebars from "handlebars";
import { prisma } from "../db/connection";
import { User, UserRole, UserStatus } from "../generated/prisma";
import { jwtSign } from "../lib/jwt.sign";
import fs from "fs";
import { transporter } from "../lib/transporter";
import bcrypt from "bcrypt";
import snakecaseKeys from "snakecase-keys";

export const authRegisterService = async ({
  fullName,
  dateOfBirth,
  email,
  phoneNumber,
}: Pick<User, "fullName" | "dateOfBirth" | "email" | "phoneNumber">) => {
  try {
    const userRole = UserRole.CUSTOMER;
    const user = await prisma.user.create({
      data: {
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        email,
        phoneNumber,
        userRole,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    const token = await jwtSign(
      { userId: user?.id },
      process.env.JWT_SECRET_KEY!,
      {
        algorithm: "HS256",
      }
    );

    const templateHtml = fs.readFileSync(
      "src/public/verify-email.html",
      "utf-8"
    );
    const compiledTemplateHtml = Handlebars.compile(templateHtml);

    const resultTemplateHtml = compiledTemplateHtml({
      fullName: user.fullName,
      verificationLink: `${process.env.LINK_VERIFICATION_EMAIL}/${token}`,
    });

    if (user) {
      await transporter.sendMail({
        to: email,
        subject: "Set your password",
        html: resultTemplateHtml,
      });
    }

    return snakecaseKeys(user);
  } catch (error: any) {
    console.log(error);
    if (error?.code === "P2002") {
      if (error?.meta?.target.includes("email")) {
        throw { message: "Email already exists", isExpose: true };
      } else if (error?.meta?.target.includes("phone_number")) {
        throw { message: "Phone Number already exists", isExpose: true };
      }
    }
    throw { message: error.message, isExpose: true };
  }
};

export const authVerificationEmailService = async ({
  id,
  password,
}: Pick<User, "id" | "password">) => {
  const checkUserById = await prisma.user.findUnique({ where: { id } });

  if (!checkUserById) {
    throw { message: `User not found`, isExpose: true };
  }

  if (!password) {
    throw { message: `Password is required`, isExpose: true };
  }

  if (checkUserById.verified) {
    throw {
      message: `Your email is already verified. Please login to continue.`,
      isExpose: true,
    };
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await prisma.user.update({
    data: {
      password: hashedPassword,
      verified: true,
      status: UserStatus.ACTIVE,
    },
    where: {
      id,
    },
    select: {
      fullName: true,
      email: true,
    },
  });

  return snakecaseKeys(user);
};
