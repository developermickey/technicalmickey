require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const { connectDB } = require('./config/db');
const { attachUser } = require('./middlewares/auth');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/course_platform');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

// Attach decoded user (if any) for template access without blocking
app.use(attachUser);
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Multer instance for ad-hoc uploads (thumbnails/certificates)
const upload = multer({ dest: path.join(__dirname, 'uploads') });
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

app.use('/', courseRoutes);
app.use('/auth', authRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  const message = err.message || 'Server error';
  if (req.originalUrl.startsWith('/api')) {
    return res.status(500).json({ message });
  }
  return res.status(500).render('error', { title: 'Error', message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
