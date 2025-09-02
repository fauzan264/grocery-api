import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';

const router = Router();

/**
 * POST /api/auth/register
 * - register user biasa (tidak boleh set role admin lewat endpoint ini)
 */
router.post('/register', authCtrl.register);

/**
 * POST /api/auth/login
 * - returns { accessToken, refreshToken, user }
 */
router.post('/login', authCtrl.login);

/**
 * POST /api/auth/refresh
 * - body: { refreshToken }
 * - returns new accessToken (+ new refreshToken)
 */
router.post('/refresh', authCtrl.refreshToken);

/**
 * POST /api/auth/logout
 * - body: { refreshToken } (atau bisa diambil dari cookie)
 * - clears refresh token on server side
 */
router.post('/logout', authCtrl.logout);

export default router;
