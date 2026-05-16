const express = require('express');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const cache = require('../config/redis');

const router = express.Router();

// POST /api/posts — create post
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Media file required' });

    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    const post = await Post.create({
      author: req.user._id,
      mediaUrl: req.file.path,
      mediaPublicId: req.file.filename,
      mediaType,
      caption: req.body.caption || '',
    });

    await post.populate('author', 'username name profilePhoto');
    // Clear feed cache (just first page for now)
    await cache.del('posts:feed:1:20'); 
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/feed — all posts for explore/search gallery
router.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `posts:feed:${page}:${limit}`;
    if (cache) {
      const cached = await cache.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    const posts = await Post.find()
      .populate('author', 'username name profilePhoto isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out posts from inactive users
    const activePosts = posts.filter(p => p.author?.isActive);
    const total = await Post.countDocuments();

    const response = { posts: activePosts, total, page, pages: Math.ceil(total / limit) };
    
    // Cache for 2 minutes
    await cache.set(cacheKey, JSON.stringify(response), 120);
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/member/:username — posts by one member
const User = require('../models/User');
router.get('/member/:username', async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    });
    if (!user) return res.status(404).json({ message: 'Member not found' });

    const posts = await Post.find({ author: user._id })
      .populate('author', 'username name profilePhoto')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/like — toggle like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const liked = post.likes.some(id => id.equals(req.user._id));
    if (liked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.addToSet(req.user._id);
    }
    await post.save();
    res.json({ liked: !liked, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.author.equals(req.user._id);
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await cloudinary.uploader.destroy(post.mediaPublicId, {
      resource_type: post.mediaType === 'video' ? 'video' : 'image',
    });

    await post.deleteOne();
    await cache.del('posts:feed:1:20');
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
