const express = require('express');
const { dashboard, profile } = require('../controllers/userController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/dashboard', dashboard);
router.get('/profile', profile);

module.exports = router;
