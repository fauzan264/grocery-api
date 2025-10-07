import Handlebars from "handlebars";
import { prisma } from "../db/connection";
import { User, UserProvider, UserRole, UserStatus } from "../generated/prisma";
import { jwtSign } from "../lib/jwt.sign";
import fs from "fs";
import { transporter } from "../lib/transporter";
import bcrypt from "bcrypt";
import snakecaseKeys from "snakecase-keys";
import { IAuthChangePasswordServiceProps } from "../types/auth";

export const authRegisterService = async ({
  fullName,
  email,
  phoneNumber,
}: Pick<User, "fullName" | "email" | "phoneNumber">) => {
  try {
    const userRole = UserRole.CUSTOMER;
    const user = await prisma.user.create({
      data: {
        fullName,
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
      { user_id: user?.id },
      process.env.JWT_SECRET_KEY!,
      {
        algorithm: "HS256",
        expiresIn: "1h",
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

export const authLoginService = async ({
  email,
  password,
}: Pick<User, "email" | "password">) => {
  const checkUserByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (!checkUserByEmail) {
    throw { message: "Email is not register", isExpose: true };
  }

  if (!password) {
    throw { message: "Password is required", isExpose: true };
  }

  if (!checkUserByEmail.password) {
    throw {
      message:
        "Your email address has not been verified. Please check your inbox and click the verification link we sent you before you can login.",
    };
  }

  const comparePassword = await bcrypt.compare(
    password,
    checkUserByEmail?.password
  );

  if (!comparePassword) throw { message: "Password not valid", isExpose: true };

  const token = await jwtSign(
    {
      user_id: checkUserByEmail.id,
      role: checkUserByEmail.userRole,
    },
    process.env.JWT_SECRET_KEY!,
    { algorithm: "HS256" }
  );

  return {
    token,
    full_name: checkUserByEmail?.fullName,
    role: checkUserByEmail?.userRole,
  };
};

export const authRequestResetPasswordService = async ({
  email,
}: Pick<User, "email">) => {
  const checkUserByEmail = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!checkUserByEmail) {
    throw { message: `Email is not registered`, isExpose: true };
  }

  const token = await jwtSign(
    { user_id: checkUserByEmail?.id },
    process.env.JWT_SECRET_KEY!,
    { algorithm: "HS256" }
  );

  const templateHtml = fs.readFileSync(
    "src/public/reset-password.html",
    "utf-8"
  );
  const compiledTemplateHtml = Handlebars.compile(templateHtml);

  const resultTemplateHtml = compiledTemplateHtml({
    fullName: checkUserByEmail.fullName,
    resetLinkPassword: `${process.env.LINK_RESET_PASSWORD}/${token}`,
  });

  await transporter.sendMail({
    to: email,
    subject: "Reset your password",
    html: resultTemplateHtml,
  });
};

export const authResetPasswordService = async ({
  id,
  password,
}: Pick<User, "id" | "password">) => {
  const checkUserById = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!checkUserById) {
    throw { message: "User not found", isExpose: true };
  }

  if (!password) {
    throw { message: "Password is required", isExpose: true };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    data: { password: hashedPassword },
    where: { id },
  });
};

export const authChangePasswordService = async ({
  oldPassword,
  newPassword,
  userId,
}: IAuthChangePasswordServiceProps) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) throw { message: `User not found`, isExpose: true };

  const comparePassword = await bcrypt.compare(oldPassword, user.password!);

  if (!comparePassword)
    throw {
      message: "The password you entered does not match our records.",
      isExpose: true,
    };

  if (oldPassword == newPassword)
    throw {
      message: "New password cannot be the same as the old password",
      isExpose: true,
    };

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    data: {
      password: hashedPassword,
    },
    where: {
      id: user.id,
    },
  });
};

export const authSessionLoginService = async ({ id }: Pick<User, "id">) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      fullName: true,
      userRole: true,
    },
  });

  const response = {
    ...user,
    role: user?.userRole,
  };

  return snakecaseKeys(response);
};

export const authGoogleCallbackService = async ({
  fullName,
  email,
  photoProfile,
}: Pick<User, "fullName" | "email" | "photoProfile">) => {
  let user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (user?.userProvider == UserProvider.LOCAL) {
    return {
      success: false,
      reason: "EMAIL_REGISTERED_LOCAL",
    };
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        fullName: fullName,
        email: email,
        dateOfBirth: new Date(),
        photoProfile,
        verified: true,
        userRole: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        userProvider: UserProvider.GOOGLE,
      },
    });
  }

  const token = await jwtSign(
    { user_id: user.id, role: user.userRole },
    process.env.JWT_SECRET_KEY!,
    { algorithm: "HS256" }
  );

  return {
    success: true,
    token,
  };
};
