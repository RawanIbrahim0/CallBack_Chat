import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';

// create or return existing 1:1 conversation
export const  createConversation = async (req, res) => {
  try {
    const { participantId } = req.body; // other user id
    const me = req.user._id;
    if (!participantId) return res.status(400).json({ message: 'participantId required' });

    // ensure both ids valid
    if (!mongoose.Types.ObjectId.isValid(participantId)) return res.status(400).json({ message: 'invalid id' });

    // try find existing between same two users (order-independent)
    const conv = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [me, participantId], $size: 2 }
    });

    if (conv) return res.json(conv);

    const created = await Conversation.create({ participants: [me, participantId], isGroup: false, lastMessageAt: new Date() });
    res.json(created);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

export const listConversations = async (req, res) => {
  try {
    const me = req.user._id;
    // fetch conversations where user participates
    const convs = await Conversation.find({ participants: me }).sort({ lastMessageAt: -1 }).lean();

    // for each conv compute unread count and last message
    const results = await Promise.all(convs.map(async (c) => {
      const lastMsg = await Message.findOne({ conversation: c._id }).sort({ createdAt: -1 }).limit(1).lean();
      const unread = await Message.countDocuments({ conversation: c._id, from: { $ne: me }, readBy: { $ne: me } });
      return { ...c, lastMessage: lastMsg || null, unreadCount: unread };
    }));

    res.json(results);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

export const getMessages = async (req, res) => {
  try {
    const { id } = req.params; // conversation id
    const limit = parseInt(req.query.limit || '50', 10);
    const before = req.query.before; // optional message id or date

    const query = { conversation: id };
    if (before) {
      if (mongoose.Types.ObjectId.isValid(before)) {
        const m = await Message.findById(before);
        if (m) query.createdAt = { $lt: m.createdAt };
      } else {
        const d = new Date(before);
        if (!isNaN(d)) query.createdAt = { $lt: d };
      }
    }

    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit).populate('from', 'username avatarUrl').lean();
    res.json(messages.reverse()); // return chronological
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params; // conversation id
    const me = req.user._id;
    await Message.updateMany({ conversation: id, from: { $ne: me }, readBy: { $ne: me } }, { $addToSet: { readBy: me } });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};
