const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const cache = require('../config/redis');

const router = express.Router();

// GET /api/members — all active members (public)
router.get('/', async (req, res) => {
  try {
    const cached = await cache.get('members:all');
    if (cached) return res.json(JSON.parse(cached));

    const members = await User.find({ isActive: true, isAdmin: false })
      .select('username name profilePhoto bio followers following')
      .sort({ createdAt: -1 });

    await cache.set('members:all', JSON.stringify(members), 120);
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/members/:username — public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
      isActive: true,
      isAdmin: false,
    })
      .select('-password')
      .populate('followers', 'username name profilePhoto')
      .populate('following', 'username name profilePhoto');

    if (!user) return res.status(404).json({ message: 'Member not found' });

    const posts = await Post.find({ author: user._id })
      .populate('author', 'username name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/members/:username — edit own profile
router.put('/:username', auth, upload.single('profilePhoto'), async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.bio !== undefined) user.bio = req.body.bio;

    if (req.body.username) {
      const newUsername = req.body.username.toLowerCase().trim();
      if (newUsername !== user.username) {
        const conflict = await User.findOne({ username: newUsername });
        if (conflict) return res.status(400).json({ message: 'Username already taken' });
        user.username = newUsername;
      }
    }

    if (req.file) {
      if (user.profilePhoto?.publicId) {
        await cloudinary.uploader.destroy(user.profilePhoto.publicId).catch(() => {});
      }
      user.profilePhoto = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    await user.save();
    await cache.del('members:all');
    res.json({ user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/members/:username/follow — toggle follow/unfollow
router.post('/:username/follow', auth, async (req, res) => {
  try {
    const target = await User.findOne({
      username: req.params.username.toLowerCase(),
      isActive: true,
    });
    if (!target) return res.status(404).json({ message: 'Member not found' });
    if (target._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const isFollowing = target.followers.some(id => id.equals(req.user._id));

    if (isFollowing) {
      await User.findByIdAndUpdate(target._id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: target._id } });
    } else {
      await User.findByIdAndUpdate(target._id, { $addToSet: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: target._id } });
    }

    await cache.del('members:all');
    res.json({ following: !isFollowing });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/members/:username/followers
router.get('/:username/followers', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate('followers', 'username name profilePhoto');
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/members/:username/following
router.get('/:username/following', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate('following', 'username name profilePhoto');
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
