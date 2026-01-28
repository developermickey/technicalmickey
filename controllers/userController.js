const Order = require('../models/Order');

const dashboard = async (req, res) => {
  const purchases = await Order.find({ user: req.user._id, status: 'paid' }).populate('course');
  res.render('student/dashboard', {
    title: 'Dashboard',
    purchases,
    totalCourses: req.user.purchasedCourses.length,
  });
};

const profile = (req, res) => {
  res.render('student/profile', { title: 'Profile', user: req.user });
};

module.exports = { dashboard, profile };
