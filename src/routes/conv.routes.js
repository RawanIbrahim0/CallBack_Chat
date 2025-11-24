import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { createConversation, listConversations, getMessages, markRead } from '../controllers/conv.controller.js';

const router = express.Router();

router.post('/', authMiddleware, createConversation);
router.get('/', authMiddleware, listConversations);
router.get('/:id/messages', authMiddleware, getMessages);
router.patch('/:id/read', authMiddleware, markRead);

export default router;
