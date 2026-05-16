const express = require('express');
const User = require('../models/User');

const router = express.Router();

// GET /api/search/members?q=
router.get('/members', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json([]);
    }

    const regex = new RegExp(q.trim(), 'i');
    const members = await User.find({
      isActive: true,
      $or: [{ username: regex }, { name: regex }],
    })
      .select('username name profilePhoto bio dob')
      .limit(20);

    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
