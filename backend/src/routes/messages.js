const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/messages/conversations — all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate partner info
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const partner = await User.findById(conv._id).select('username name profilePhoto');
        return { partner, lastMessage: conv.lastMessage, unread: conv.unread };
      })
    );

    res.json(populated.filter(c => c.partner));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/:userId — chat thread
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .populate('sender', 'username name profilePhoto')
      .populate('receiver', 'username name profilePhoto')
      .sort({ createdAt: 1 });

    // Mark received messages as read
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/:userId — send message
router.post('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content required' });
    }

    const receiver = await User.findById(userId);
    if (!receiver || !receiver.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: userId,
      content: content.trim(),
    });

    await message.populate('sender', 'username name profilePhoto');
    await message.populate('receiver', 'username name profilePhoto');

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
