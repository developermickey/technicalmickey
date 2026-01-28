const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, `${unique}-${safeName}`);
  },
});

const upload = multer({ storage });

module.exports = { upload };
