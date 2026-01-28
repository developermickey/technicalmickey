const User = require('../models/User');
const { signToken } = require('../middlewares/auth');

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const getRegister = (req, res) => res.render('auth/register', { title: 'Register' });
const getLogin = (req, res) => res.render('auth/login', { title: 'Login' });

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.render('auth/register', { title: 'Register', error: 'Email already in use' });
    const user = await User.create({ name, email, password, role: 'student' });
    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
    return res.redirect('/user/dashboard');
  } catch (err) {
    return res.status(400).render('auth/register', { title: 'Register', error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.render('auth/login', { title: 'Login', error: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.render('auth/login', { title: 'Login', error: 'Invalid credentials' });
    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
    const redirectTo = req.query.next || (user.role === 'admin' ? '/admin' : '/user/dashboard');
    return res.redirect(redirectTo);
  } catch (err) {
    return res.status(400).render('auth/login', { title: 'Login', error: err.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  return res.redirect('/');
};

module.exports = { getRegister, getLogin, register, login, logout };
