import jwt, { SignOptions } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET as string
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m"
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"

export function signAccessToken(payload: object): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN }
  return jwt.sign(payload, JWT_SECRET, options)
}

export function signRefreshToken(payload: object): string {
  const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, options)
}

export function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    throw new Error("Invalid or expired access token")
  }
}

export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET)
  } catch (err) {
    throw new Error("Invalid or expired refresh token")
  }
}
