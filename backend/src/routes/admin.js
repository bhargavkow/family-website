const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const cache = require('../config/redis');

const router = express.Router();

// All admin routes require admin auth
router.use(adminAuth);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalMembers, activeMembers, totalPosts, totalMessages] = await Promise.all([
      User.countDocuments({ isAdmin: false }),
      User.countDocuments({ isAdmin: false, isActive: true }),
      Post.countDocuments(),
      require('../models/Message').countDocuments(),
    ]);
    res.json({ totalMembers, activeMembers, disabledMembers: totalMembers - activeMembers, totalPosts, totalMessages });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/members
router.get('/members', async (req, res) => {
  try {
    const members = await User.find({ isAdmin: false })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/members — create new member
router.post('/members', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, username, password, bio } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Name, username, and password are required' });
    }

    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Username already taken' });

    const userData = { name, username: username.toLowerCase(), password, bio: bio || '' };

    if (req.file) {
      userData.profilePhoto = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const user = await User.create(userData);
    await cache.del('members:all');
    res.status(201).json(user.toJSON());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/members/:id/toggle — enable/disable
router.patch('/members/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    await cache.del('members:all');
    res.json({ isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/members/:id
router.delete('/members/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete admin' });

    // Delete profile photo from Cloudinary
    if (user.profilePhoto?.publicId) {
      await cloudinary.uploader.destroy(user.profilePhoto.publicId).catch(() => {});
    }

    // Delete all their posts
    const posts = await Post.find({ author: user._id });
    for (const post of posts) {
      await cloudinary.uploader.destroy(post.mediaPublicId, {
        resource_type: post.mediaType === 'video' ? 'video' : 'image',
      }).catch(() => {});
    }
    await Post.deleteMany({ author: user._id });
    await user.deleteOne();
    await cache.del('members:all');

    res.json({ message: 'Member deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/posts
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const posts = await Post.find()
      .populate('author', 'username name profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Post.countDocuments();
    res.json({ posts, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    await cloudinary.uploader.destroy(post.mediaPublicId, {
      resource_type: post.mediaType === 'video' ? 'video' : 'image',
    }).catch(() => {});
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
