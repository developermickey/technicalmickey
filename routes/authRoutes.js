const express = require('express');
const { getRegister, getLogin, register, login, logout } = require('../controllers/authController');

const router = express.Router();

router.get('/register', getRegister);
router.post('/register', register);
router.get('/login', getLogin);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
