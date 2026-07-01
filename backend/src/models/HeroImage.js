const mongoose = require('mongoose');

const heroImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('HeroImage', heroImageSchema);
