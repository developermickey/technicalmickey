const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLectures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lecture' }],
    percentage: { type: Number, default: 0 },
    lastViewedLecture: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
