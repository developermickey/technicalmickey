const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String],
      validate: (arr) => arr.length === 4,
      required: true,
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    questions: [questionSchema],
    passingScore: { type: Number, default: 60 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
