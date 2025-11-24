import User from '../models/UserModel.js';
import bcrypt from 'bcrypt';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const searchUsers = async (req, res) => {
  try {
    const q = req.query.search || '';
    const users = await User.find({ username: { $regex: q, $options: 'i' } }).limit(20).select('-passwordHash');
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

export const updateProfile = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user._id.toString() !== id) return res.status(403).json({ message: 'Forbidden' });

    const { username, statusText } = req.body;
    const update = {};
    if (username) update.username = username;
    if (statusText) update.statusText = statusText;

    if (req.body.password) {
      const hash = await bcrypt.hash(req.body.password, 10);
      update.passwordHash = hash;
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};
