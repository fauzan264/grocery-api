import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function listUsers(req: Request, res: Response) {
  const users = await userService.getAllUsers();
  return res.json({ data: users });
}

export async function createUser(req: Request, res: Response) {
  const { name, email, password, role, phone } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password required' });

  // Only allow creating STORE_ADMIN through this endpoint (business rule)
  if (role && role !== 'STORE_ADMIN') return res.status(400).json({ error: 'Can only create STORE_ADMIN from this menu' });

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userService.createUser({ name, email, passwordHash: hashed, role: 'STORE_ADMIN', phone });
  return res.status(201).json({ data: user });
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, role, phone, password } = req.body;

  const update: any = { name, phone };
  if (role && role !== 'STORE_ADMIN') return res.status(400).json({ error: 'Can only set role to STORE_ADMIN via this menu' });
  if (role) update.role = role;
  if (password) update.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const updated = await userService.updateUser(id, update);
  return res.json({ data: updated });
}

export async function removeUser(req: Request, res: Response) {
  const { id } = req.params;
  await userService.deleteUser(id);
  return res.status(204).send();
}
