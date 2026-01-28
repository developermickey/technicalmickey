const express = require('express');
const {
  getHome,
  listCourses,
  getCourseDetail,
  getAbout,
  addToCart,
  viewCart,
  myCourses,
  getLearningPage,
  recordProgress,
  renderQuizPage,
  submitQuiz,
  generateCertificate,
} = require('../controllers/courseController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/', getHome);
router.get('/about', getAbout);
router.get('/courses', listCourses);
router.get('/courses/:id', getCourseDetail);

router.post('/courses/:id/cart', requireAuth, addToCart);
router.get('/cart', requireAuth, viewCart);
router.get('/my-courses', requireAuth, myCourses);
router.get('/learn/:courseId', requireAuth, getLearningPage);
router.post('/learn/:courseId/progress', requireAuth, recordProgress);
router.get('/learn/:courseId/quiz', requireAuth, renderQuizPage);
router.post('/learn/:courseId/quiz', requireAuth, submitQuiz);
router.get('/learn/:courseId/certificate', requireAuth, generateCertificate);

module.exports = router;
