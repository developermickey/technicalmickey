const express = require('express');
const {
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  addTopic,
  addLecture,
  addQuiz,
} = require('../controllers/courseController');
const { getDashboard, manageCourses, manageCourseDetail, listUsers, listQuizzes } = require('../controllers/adminController');
const { listPurchases } = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', getDashboard);
router.get('/courses', manageCourses);
router.get('/courses/:courseId', manageCourseDetail);
router.post('/courses', upload.single('thumbnail'), createCourse);
router.post('/courses/:id', upload.single('thumbnail'), updateCourse);
router.post('/courses/:id/delete', deleteCourse);
router.post('/courses/:id/publish', togglePublish);
router.post('/courses/:courseId/topics', addTopic);
router.post('/topics/:topicId/lectures', addLecture);
router.post('/courses/:courseId/quiz', addQuiz);
router.get('/users', listUsers);
router.get('/quizzes', listQuizzes);
router.get('/purchases', listPurchases);

module.exports = router;
