const axios = require('axios');
const { baseUrl, buildPhonePePayload, phonePeHeaders, merchantId } = require('../config/phonepe');
const Course = require('../models/Course');
const Order = require('../models/Order');
const Progress = require('../models/Progress');

const sendPurchaseEmail = (user, course) => {
  if (!user || !course) return;
  // placeholder for transactional email implementation
  console.log(`Email notification: ${user.email} purchased ${course.title}`);
};

const renderCheckout = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).render('404', { title: 'Not found' });
  res.render('student/checkout', { title: 'Checkout', course });
};

const createOrder = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).render('404', { title: 'Not found' });
  const alreadyOwned = req.user.purchasedCourses.some((id) => id.toString() === course.id);
  if (alreadyOwned) return res.redirect(`/learn/${course._id}`);
  const amountPaise = Math.round(course.price * 100);

  const merchantTransactionId = `txn_${Date.now()}`;
  const payload = {
    merchantId,
    merchantTransactionId,
    merchantUserId: req.user._id.toString(),
    amount: amountPaise,
    redirectUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/orders/success/${merchantTransactionId}`,
    redirectMode: 'POST',
    callbackUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/orders/callback`,
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const { base64Payload, checksum } = buildPhonePePayload(payload, '/pg/v1/pay');

  await Order.create({
    user: req.user._id,
    course: course._id,
    amount: course.price,
    status: 'pending',
    merchantTransactionId,
  });

  const phonePeResponse = await axios.post(
    `${baseUrl}/pg/v1/pay`,
    { request: base64Payload },
    { headers: phonePeHeaders(checksum) }
  );

  const redirectUrl = phonePeResponse.data?.data?.instrumentResponse?.redirectInfo?.url;
  if (!redirectUrl) {
    return res.status(400).render('error', { title: 'Payment error', message: 'Failed to initiate payment' });
  }
  return res.redirect(redirectUrl);
};

const handleCallback = async (req, res) => {
  const { merchantTransactionId, code, providerReferenceId } = req.body || {};
  const order = await Order.findOne({ merchantTransactionId }).populate('course').populate('user');
  if (!order) return res.status(404).send('Order not found');

  if (code === 'PAYMENT_SUCCESS') {
    order.status = 'paid';
    order.providerReferenceId = providerReferenceId;
    await order.save();
    const user = order.user;
    if (user && !user.purchasedCourses.includes(order.course._id)) {
      user.purchasedCourses.push(order.course._id);
      user.cart = user.cart.filter((c) => c.toString() !== order.course._id.toString());
      await user.save();
    }
    sendPurchaseEmail(user, order.course);
    await Progress.findOneAndUpdate(
      { user: order.user, course: order.course._id },
      { percentage: 0 },
      { upsert: true }
    );
    return res.redirect(`/orders/success/${merchantTransactionId}`);
  }
  order.status = 'failed';
  await order.save();
  return res.redirect(`/orders/failed/${merchantTransactionId}`);
};

const renderSuccess = async (req, res) => {
  const order = await Order.findOne({ merchantTransactionId: req.params.txn }).populate('course');
  if (!order) return res.status(404).render('404', { title: 'Not found' });
  res.render('student/payment-success', { title: 'Payment Success', order });
};

const renderFailure = async (req, res) => {
  const order = await Order.findOne({ merchantTransactionId: req.params.txn }).populate('course');
  if (!order) return res.status(404).render('404', { title: 'Not found' });
  res.render('error', { title: 'Payment failed', message: 'Payment was not completed. Please try again.' });
};

const listPurchases = async (req, res) => {
  const purchases = await Order.find({ status: 'paid' }).populate('user').populate('course');
  res.render('admin/purchases', { title: 'Purchases', purchases });
};

module.exports = {
  renderCheckout,
  createOrder,
  handleCallback,
  renderSuccess,
  renderFailure,
  listPurchases,
};
