const User = require('../models/User');
const Course = require('../models/Course');
const Order = require('../models/Order');
const Topic = require('../models/Topic');
const Quiz = require('../models/Quiz');

const getDashboard = async (req, res) => {
  const [totalUsers, totalCourses, totalSales] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Order.countDocuments({ status: 'paid' }),
  ]);
  const revenueAgg = await Order.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, revenue: { $sum: '$amount' } } },
  ]);
  const revenue = revenueAgg[0]?.revenue || 0;
  res.render('admin/dashboard', { title: 'Admin Dashboard', totalUsers, totalCourses, totalSales, revenue });
};

const manageCourses = async (req, res) => {
  const courses = await Course.find().populate('quiz');
  res.render('admin/manage-courses', { title: 'Manage Courses', courses });
};

const manageCourseDetail = async (req, res) => {
  const course = await Course.findById(req.params.courseId)
    .populate({
      path: 'topics',
      populate: { path: 'lectures' },
    })
    .populate('quiz');
  res.render('admin/course-detail', { title: 'Edit Course', course });
};

const listUsers = async (req, res) => {
  const users = await User.find();
  res.render('admin/users', { title: 'Users', users });
};

const listQuizzes = async (req, res) => {
  const quizzes = await Quiz.find().populate('course');
  res.render('admin/quizzes', { title: 'Quizzes', quizzes });
};

module.exports = {
  getDashboard,
  manageCourses,
  manageCourseDetail,
  listUsers,
  listQuizzes,
};
