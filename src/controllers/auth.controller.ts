// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from "jsonwebtoken"  // import default + tipe


const prisma = new PrismaClient();
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '12', 10);

// ambil env dan pastikan ada (fail fast)
const JWT_SECRET: string = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN!;
const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET!;
const REFRESH_TOKEN_EXPIRES_IN: string = process.env.REFRESH_TOKEN_EXPIRES_IN!;

if (!JWT_SECRET) throw new Error('Missing env: JWT_SECRET');
if (!REFRESH_TOKEN_SECRET) throw new Error('Missing env: REFRESH_TOKEN_SECRET');

export type AuthPayload = {
  userId: string;
  role: string;
  [key: string]: any;
};

// helpers (casting tipe supaya TS tidak complain)
function signAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: JWT_EXPIRES_IN as string,
  } as SignOptions);
}

function signRefreshToken(payload: object) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as string,
  } as SignOptions);
}


export function verifyAccessToken(token: string): AuthPayload {
  // jwt.verify bisa return string atau JwtPayload -> cast ke JwtPayload
  return jwt.verify(token, JWT_SECRET) as AuthPayload
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET ) as AuthPayload
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email & password required' });

    // prevent creating admin via public register
    if (req.body.role && req.body.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Cannot set role via public register' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone, role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });

    return res.status(201).json({ data: user });
  } catch (err: any) {
    console.error('register err', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email & password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // store hashed refresh token in DB (never store plaintext)
    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: hashedRefresh } });

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err: any) {
    console.error('login err', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    // verify token signature first
    let payload: any;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Refresh token expired" });
    }
    return res.status(401).json({ error: "Invalid refresh token" });
    }

    const userId = payload.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // compare hashed refresh token
    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) return res.status(401).json({ error: 'Refresh token revoked' });

    // issue new tokens
    const newPayload = { userId: user.id, role: user.role };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    const newHashed = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: newHashed } });

    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err: any) {
    console.error('refreshToken err', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    // try verify to get userId (but if expired, we'll fallback to compare hashed)
    let payload: any = null;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (e) {
      // token expired or invalid — we'll still search by stored hash below
    }

    // strategy: find user whose refreshTokenHash matches this token
    const users = await prisma.user.findMany({ where: { NOT: { refreshTokenHash: null } } });
    const target = await (async () => {
      for (const u of users) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const ok = await bcrypt.compare(refreshToken, u.refreshTokenHash!);
          if (ok) return u;
        } catch (e) { /* continue */ }
      }
      return null;
    })();

    if (!target) {
      // Nothing to clear, but respond success to avoid token fishing
      return res.json({ message: 'Logged out' });
    }

    await prisma.user.update({ where: { id: target.id }, data: { refreshTokenHash: null } });

    return res.json({ message: 'Logged out' });
  } catch (err: any) {
    console.error('logout err', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
