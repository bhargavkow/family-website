const express = require('express');
const HeroImage = require('../models/HeroImage');
const { adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// GET /api/hero - Public ok
router.get('/', async (req, res) => {
  try {
    const images = await HeroImage.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/hero - Admin Only
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    const heroImg = await HeroImage.create({
      url: req.file.path,
      publicId: req.file.filename
    });
    res.status(201).json(heroImg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/hero/:id - Admin Only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const heroImg = await HeroImage.findById(req.params.id);
    if (!heroImg) {
      return res.status(404).json({ message: 'Image not found' });
    }
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(heroImg.publicId).catch(() => {});
    await heroImg.deleteOne();
    res.json({ message: 'Hero image deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
