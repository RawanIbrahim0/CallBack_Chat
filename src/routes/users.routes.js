import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { getProfile, searchUsers, updateProfile } from '../controllers/users.controller.js';

const router = express.Router();

router.get('/', authMiddleware, searchUsers); // ?search=
router.get('/:id', authMiddleware, getProfile);
router.put('/:id', authMiddleware, updateProfile);

export default router;
