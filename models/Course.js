const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    thumbnail: { type: String },
    category: { type: String },
    topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    certificateTemplate: { type: String },
    published: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
