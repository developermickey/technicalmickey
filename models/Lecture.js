const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema(
  {
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lecture', lectureSchema);
