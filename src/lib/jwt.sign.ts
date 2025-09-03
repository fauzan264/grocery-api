import jwt from "jsonwebtoken";

export const jwtSign = async (
  payload: string | Buffer | object,
  secretOrPrivateKey: jwt.Secret | jwt.PrivateKey,
  options?: jwt.SignOptions
) => {
  return await jwt.sign(payload, secretOrPrivateKey, options);
};
