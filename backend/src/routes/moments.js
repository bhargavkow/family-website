const express = require('express');
const Moment = require('../models/Moment');
const { adminAuth, auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// GET /api/moments  — public, returns all folders with their images
router.get('/', async (req, res) => {
  try {
    const moments = await Moment.find().sort({ createdAt: -1 });
    res.json(moments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/moments  — admin only, create folder (optional cover image)
router.post('/', adminAuth, upload.single('coverImage'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Folder name is required' });

    const data = { name: name.trim() };
    if (req.file) {
      data.coverImage = { url: req.file.path, publicId: req.file.filename };
    }

    const moment = await Moment.create(data);
    res.status(201).json(moment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/moments/:id/images  — admin, upload images to folder
router.post('/:id/images', adminAuth, upload.array('images', 20), async (req, res) => {
  try {
    const moment = await Moment.findById(req.params.id);
    if (!moment) return res.status(404).json({ message: 'Folder not found' });

    const newImages = (req.files || []).map(f => ({
      url: f.path,
      publicId: f.filename,
      caption: '',
    }));

    moment.images.push(...newImages);

    // Auto-set cover if none
    if (!moment.coverImage?.url && newImages.length > 0) {
      moment.coverImage = { url: newImages[0].url, publicId: newImages[0].publicId };
    }

    await moment.save();
    res.json(moment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/moments/:id/images/:imgId  — admin, remove single image
router.delete('/:id/images/:imgId', adminAuth, async (req, res) => {
  try {
    const moment = await Moment.findById(req.params.id);
    if (!moment) return res.status(404).json({ message: 'Folder not found' });

    const img = moment.images.id(req.params.imgId);
    if (!img) return res.status(404).json({ message: 'Image not found' });

    await cloudinary.uploader.destroy(img.publicId).catch(() => {});
    img.deleteOne();
    await moment.save();
    res.json(moment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/moments/:id  — admin, delete entire folder
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const moment = await Moment.findById(req.params.id);
    if (!moment) return res.status(404).json({ message: 'Folder not found' });

    // Delete all images from cloudinary
    for (const img of moment.images) {
      await cloudinary.uploader.destroy(img.publicId).catch(() => {});
    }
    if (moment.coverImage?.publicId) {
      await cloudinary.uploader.destroy(moment.coverImage.publicId).catch(() => {});
    }

    await moment.deleteOne();
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
