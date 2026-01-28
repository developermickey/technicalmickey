const express = require('express');
const { renderCheckout, createOrder, handleCallback, renderSuccess, renderFailure } = require('../controllers/orderController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/checkout/:courseId', requireAuth, renderCheckout);
router.post('/checkout/:courseId', requireAuth, createOrder);
router.post('/callback', handleCallback);
router.get('/success/:txn', renderSuccess);
router.get('/failed/:txn', renderFailure);

module.exports = router;
