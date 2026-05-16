const express = require('express');
const Event = require('../models/Event');
const { adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const cache = require('../config/redis');

const router = express.Router();

// GET /api/events — public list of upcoming events
router.get('/', async (req, res) => {
  try {
    const cached = await cache.get('events:upcoming');
    if (cached) return res.json(JSON.parse(cached));

    const events = await Event.find({ date: { $gte: new Date() } })
      .sort({ date: 1 });
    
    await cache.set('events:upcoming', JSON.stringify(events), 300);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events — Create new event (Admin only)
router.post('/', ...adminAuth, upload.single('photo'), async (req, res) => {
  try {
    const { name, description, date } = req.body;
    
    let photo = null;
    if (req.file) {
      photo = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const newEvent = new Event({
      name,
      description,
      date,
      photo
    });

    await newEvent.save();
    await cache.del('events:upcoming');
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/events/:id — Delete event (Admin only)
router.delete('/:id', ...adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.photo?.publicId) {
      await cloudinary.uploader.destroy(event.photo.publicId).catch(() => {});
    }

    await event.deleteOne();
    await cache.del('events:upcoming');
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
