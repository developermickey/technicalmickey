const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Course = require('../models/Course');
const Topic = require('../models/Topic');
const Lecture = require('../models/Lecture');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');

const getHome = async (req, res) => {
  const courses = await Course.find({ published: true }).limit(6);
  const categories = await Course.distinct('category');
  res.render('home', { title: 'Home', courses, categories });
};

const getAbout = (req, res) => {
  res.render('about', { title: 'About' });
};

const listCourses = async (req, res) => {
  const { search = '', category, page = 1 } = req.query;
  const pageSize = 9;
  const filters = { published: true };
  if (search) filters.title = { $regex: search, $options: 'i' };
  if (category) filters.category = category;
  const courses = await Course.find(filters)
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  const total = await Course.countDocuments(filters);
  res.render('courses', {
    title: 'Courses',
    courses,
    search,
    category,
    currentPage: Number(page),
    totalPages: Math.ceil(total / pageSize) || 1,
  });
};

const getCourseDetail = async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate({
      path: 'topics',
      populate: { path: 'lectures' },
    })
    .populate('quiz');
  if (!course) return res.status(404).render('404', { title: 'Not found' });
  res.render('course-detail', { title: course.title, course });
};

const createCourse = async (req, res) => {
  const { title, description, price, category } = req.body;
  const thumbnail = req.file ? `/uploads/${path.basename(req.file.path)}` : undefined;
  const course = await Course.create({
    title,
    description: description || 'Course description coming soon.',
    price: Number(price) || 0,
    category,
    thumbnail,
    createdBy: req.user._id,
  });
  return res.redirect(`/admin/courses/${course._id}`);
};

const updateCourse = async (req, res) => {
  const { title, description, price, category, published } = req.body;
  const updates = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (price) updates.price = price;
  if (category) updates.category = category;
  if (typeof published !== 'undefined') updates.published = ['true', 'on', true].includes(published);
  if (req.file) {
    updates.thumbnail = `/uploads/${path.basename(req.file.path)}`;
  }
  await Course.findByIdAndUpdate(req.params.id, updates);
  return res.redirect(`/admin/courses/${req.params.id}`);
};

const deleteCourse = async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/courses');
};

const togglePublish = async (req, res) => {
  const course = await Course.findById(req.params.id);
  course.published = !course.published;
  await course.save();
  return res.redirect('/admin/courses');
};

const addTopic = async (req, res) => {
  const { title } = req.body;
  const topic = await Topic.create({ course: req.params.courseId, title });
  await Course.findByIdAndUpdate(req.params.courseId, { $push: { topics: topic._id } });
  return res.redirect(`/admin/courses/${req.params.courseId}`);
};

const addLecture = async (req, res) => {
  const { title, videoUrl, duration } = req.body;
  const lecture = await Lecture.create({
    topic: req.params.topicId,
    title,
    videoUrl,
    duration,
  });
  await Topic.findByIdAndUpdate(req.params.topicId, { $push: { lectures: lecture._id } });
  const topic = await Topic.findById(req.params.topicId);
  return res.redirect(`/admin/courses/${topic.course}`);
};

const addQuiz = async (req, res) => {
  const { question, option1, option2, option3, option4, correctAnswer } = req.body;
  const quiz = await Quiz.create({
    course: req.params.courseId,
    questions: [
      {
        question,
        options: [option1, option2, option3, option4],
        correctAnswer: Number(correctAnswer || 0),
      },
    ],
  });
  await Course.findByIdAndUpdate(req.params.courseId, { quiz: quiz._id });
  return res.redirect(`/admin/courses/${req.params.courseId}`);
};

const getLearningPage = async (req, res) => {
  const course = await Course.findById(req.params.courseId)
    .populate({
      path: 'topics',
      populate: { path: 'lectures' },
    })
    .populate('quiz');
  if (!course) return res.status(404).render('404', { title: 'Not found' });
  const hasAccess = req.user.purchasedCourses.some((id) => id.toString() === course.id);
  if (!hasAccess) return res.status(403).render('error', { title: 'No access', message: 'Purchase required' });
  const progress = await Progress.findOne({ user: req.user._id, course: course._id });
  res.render('student/course-learn', { title: course.title, course, progress });
};

const recordProgress = async (req, res) => {
  const { lectureId } = req.body;
  const courseId = req.params.courseId;
  const course = await Course.findById(courseId).populate({
    path: 'topics',
    populate: { path: 'lectures' },
  });
  const totalLectures = course.topics.reduce((acc, t) => acc + t.lectures.length, 0);
  const progress =
    (await Progress.findOne({ user: req.user._id, course: courseId })) ||
    new Progress({ user: req.user._id, course: courseId });
  const already = progress.completedLectures.some((l) => l.toString() === lectureId);
  if (!already) progress.completedLectures.push(lectureId);
  progress.lastViewedLecture = lectureId;
  progress.percentage = Math.min(
    100,
    Math.round((progress.completedLectures.length / Math.max(totalLectures, 1)) * 100)
  );
  await progress.save();
  return res.json({ percentage: progress.percentage });
};

const renderQuizPage = async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate('quiz');
  if (!course) return res.status(404).render('404', { title: 'Not found' });
  const hasAccess = req.user.purchasedCourses.some((id) => id.toString() === course.id);
  if (!hasAccess) return res.status(403).render('error', { title: 'No access', message: 'Purchase required' });
  res.render('student/quiz', { title: 'Quiz', course });
};

const submitQuiz = async (req, res) => {
  const courseId = req.params.courseId;
  const { answers = [] } = req.body;
  const course = await Course.findById(courseId).populate('quiz');
  if (!course.quiz) return res.status(400).json({ message: 'Quiz not configured' });
  const hasAccess = req.user.purchasedCourses.some((id) => id.toString() === courseId);
  if (!hasAccess) return res.status(403).json({ message: 'Purchase required' });
  const total = course.quiz.questions.length;
  let score = 0;
  course.quiz.questions.forEach((q, idx) => {
    if (Number(answers[idx]) === q.correctAnswer) score += 1;
  });
  const percentage = Math.round((score / Math.max(total, 1)) * 100);
  return res.json({ score, total, percentage, passed: percentage >= course.quiz.passingScore });
};

const addToCart = async (req, res) => {
  const courseId = req.params.id;
  const exists = req.user.cart.some((c) => c.toString() === courseId);
  if (!exists) {
    req.user.cart.push(courseId);
    await req.user.save();
  }
  return res.redirect('/cart');
};

const viewCart = async (req, res) => {
  const user = await req.user.populate('cart');
  res.render('student/cart', { title: 'Cart', items: user.cart });
};

const myCourses = async (req, res) => {
  const user = await req.user.populate('purchasedCourses');
  res.render('student/my-courses', { title: 'My Courses', courses: user.purchasedCourses });
};

const generateCertificate = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  const progress = await Progress.findOne({ user: req.user._id, course: req.params.courseId });
  if (!progress || progress.percentage < 100) {
    return res.status(400).render('error', { title: 'Incomplete', message: 'Finish course to download certificate.' });
  }
  const certificatesDir = path.join(__dirname, '..', 'public', 'certificates');
  if (!fs.existsSync(certificatesDir)) fs.mkdirSync(certificatesDir, { recursive: true });
  const filePath = path.join(certificatesDir, `${req.user._id}-${course._id}.pdf`);
  const doc = new PDFDocument({ layout: 'landscape' });
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(30).text('Certificate of Completion', { align: 'center' });
  doc.moveDown();
  doc.fontSize(20).text(`Awarded to ${req.user.name}`, { align: 'center' });
  doc.moveDown();
  doc.text(`For successfully completing ${course.title}`, { align: 'center' });
  doc.end();
  await Certificate.findOneAndUpdate(
    { user: req.user._id, course: course._id },
    { filePath: `/public/certificates/${path.basename(filePath)}` },
    { upsert: true, new: true }
  );
  return res.download(filePath);
};

module.exports = {
  getHome,
  listCourses,
  getCourseDetail,
  getAbout,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  addTopic,
  addLecture,
  addQuiz,
  getLearningPage,
  recordProgress,
  submitQuiz,
  addToCart,
  viewCart,
  myCourses,
  renderQuizPage,
  generateCertificate,
};
