require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

const User = require('../models/User');
const Course = require('../models/Course');
const Topic = require('../models/Topic');
const Lecture = require('../models/Lecture');
const Quiz = require('../models/Quiz');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/course_platform';

async function run() {
  await connectDB(MONGO_URI);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const studentEmail = process.env.SEED_STUDENT_EMAIL || 'student@example.com';
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'Student@12345';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
  }

  let student = await User.findOne({ email: studentEmail });
  if (!student) {
    student = await User.create({
      name: 'Demo Student',
      email: studentEmail,
      password: studentPassword,
      role: 'student',
    });
  } else if (student.role !== 'student') {
    student.role = 'student';
    await student.save();
  }

  // Clean demo courses owned by admin (safe-ish reset for demos)
  const adminCourses = await Course.find({ createdBy: admin._id }).select('_id');
  const adminCourseIds = adminCourses.map((c) => c._id);
  const topicIds = await Topic.find({ course: { $in: adminCourseIds } }).distinct('_id');
  await Lecture.deleteMany({ topic: { $in: topicIds } });
  await Quiz.deleteMany({ course: { $in: adminCourseIds } });
  await Topic.deleteMany({ course: { $in: adminCourseIds } });
  await Course.deleteMany({ createdBy: admin._id });

  const course = await Course.create({
    title: 'Node.js + MongoDB Masterclass',
    description: 'Build a complete course platform with Express, MongoDB, EJS, Tailwind, payments, and certificates.',
    price: 499,
    category: 'Backend',
    published: true,
    createdBy: admin._id,
  });

  const topic1 = await Topic.create({ course: course._id, title: 'Getting Started' });
  const topic2 = await Topic.create({ course: course._id, title: 'Core Features' });

  const lec1 = await Lecture.create({
    topic: topic1._id,
    title: 'Project Overview',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '08:12',
  });
  const lec2 = await Lecture.create({
    topic: topic1._id,
    title: 'Environment Setup',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '10:05',
  });
  const lec3 = await Lecture.create({
    topic: topic2._id,
    title: 'Auth + Roles',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '14:20',
  });

  topic1.lectures.push(lec1._id, lec2._id);
  topic2.lectures.push(lec3._id);
  await topic1.save();
  await topic2.save();

  course.topics.push(topic1._id, topic2._id);
  await course.save();

  const quiz = await Quiz.create({
    course: course._id,
    passingScore: 60,
    questions: [
      {
        question: 'Which library is used for MongoDB ODM in this project?',
        options: ['Sequelize', 'Mongoose', 'Prisma', 'TypeORM'],
        correctAnswer: 1,
      },
      {
        question: 'What template engine is used for frontend rendering?',
        options: ['Pug', 'Handlebars', 'EJS', 'Mustache'],
        correctAnswer: 2,
      },
    ],
  });

  course.quiz = quiz._id;
  await course.save();

  // Auto-enroll student in demo course (so learning/progress pages work immediately)
  student.purchasedCourses = Array.from(new Set([...(student.purchasedCourses || []).map(String), String(course._id)])).map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  await student.save();

  console.log('Seed complete.');
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Student: ${studentEmail} / ${studentPassword}`);
  console.log(`Demo course id: ${course._id}`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    // mongoose connection is created by connectDB -> mongoose.connect
    await mongoose.connection.close().catch(() => {});
  });

