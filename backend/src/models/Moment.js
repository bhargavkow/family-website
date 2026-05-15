const mongoose = require('mongoose');

const momentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  coverImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, default: '' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Moment', momentSchema);
