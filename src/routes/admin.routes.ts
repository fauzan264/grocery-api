import { Router } from 'express';
import * as adminCtrl from '../controllers/adminUsers.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Admin Dashboard entrypoint: allowed for both SUPER_ADMIN and STORE_ADMIN
// but Manage User Data below further restricted to SUPER_ADMIN
router.get('/dashboard', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'STORE_ADMIN']), (req, res) => {
  res.json({ message: 'Welcome to Admin Dashboard' });
});

// Manage User Data (ONLY SUPER_ADMIN)
router.get('/users', authenticateToken, authorizeRoles(['SUPER_ADMIN']), adminCtrl.listUsers);
router.post('/users', authenticateToken, authorizeRoles(['SUPER_ADMIN']), adminCtrl.createUser);
router.put('/users/:id', authenticateToken, authorizeRoles(['SUPER_ADMIN']), adminCtrl.updateUser);
router.delete('/users/:id', authenticateToken, authorizeRoles(['SUPER_ADMIN']), adminCtrl.removeUser);

export default router;
