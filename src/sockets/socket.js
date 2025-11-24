import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

// Map userId -> Set(socketId)
const onlineUsers = new Map();

export default function setupSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Auth error'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;
      next();
    } catch (err) {
      next(new Error('Auth error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId.toString();
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // emit updated online list
    io.emit('online_users', Array.from(onlineUsers.keys()));

    // join user's conversation rooms (optional)
    // can implement: fetch convs and socket.join(convId)

    socket.on('send_message', async (payload, ack) => {
      try {
        // payload: { conversationId, text, attachments }
        const message = await Message.create({
          conversation: payload.conversationId,
          from: userId,
          text: payload.text || '',
          attachments: payload.attachments || []
        });

        await Conversation.findByIdAndUpdate(payload.conversationId, { lastMessageAt: new Date() });

        const populated = await Message.findById(message._id).populate('from', 'username avatarUrl').lean();

        // send to participants
        const conv = await Conversation.findById(payload.conversationId).lean();
        const recipients = conv.participants.map(id => id.toString()).filter(id => id !== userId);

        for (const rid of recipients) {
          const sockets = onlineUsers.get(rid);
          if (sockets) for (const sid of sockets) io.to(sid).emit('new_message', populated);
        }

        if (ack) ack({ status: 'ok', message: populated });
      } catch (err) {
        console.error('send_message error', err);
        if (ack) ack({ status: 'error' });
      }
    });

    socket.on('mark_read', async ({ conversationId }) => {
      try {
        await Message.updateMany({ conversation: conversationId, from: { $ne: userId }, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } });
        socket.emit('marked_read', { conversationId });
      } catch (err) { console.error(err); }
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      // broadcast typing to other participant(s)
      Conversation.findById(conversationId).then(conv => {
        if (!conv) return;
        const others = conv.participants.map(id => id.toString()).filter(id => id !== userId);
        for (const rid of others) {
          const sockets = onlineUsers.get(rid);
          if (sockets) for (const sid of sockets) io.to(sid).emit('typing', { conversationId, userId, isTyping });
        }
      }).catch(err => console.error(err));
    });

    socket.on('disconnect', () => {
      const set = onlineUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) onlineUsers.delete(userId);
      }
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });
  });
}
