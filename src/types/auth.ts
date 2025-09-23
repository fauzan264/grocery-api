import { User } from "../generated/prisma";

export interface IAuthChangePasswordServiceProps {
  oldPassword: string;
  newPassword: string;
  userId: string;
}

export interface AuthUser extends Pick<User, "id" | "userRole"> {
  sub: string;
  stores?: string[];
}

