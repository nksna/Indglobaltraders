const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Order = require('../models/order');
const { protect } = require('../Auth/auth');

router.use(protect);

// @POST /api/payment/create-order — create Razorpay order
router.post('/create-order', asyncHandler(async (req, res) => {
  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.totalPrice * 100), // paise
    currency: 'INR',
    receipt: order.orderNumber
  });

  order.paymentResult = { razorpay_order_id: razorpayOrder.id, status: 'created' };
  await order.save();

  res.json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID
  });
}));

// @POST /api/payment/verify — verify Razorpay payment
router.post('/verify', asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  const order = await Order.findById(orderId);
  order.isPaid = true;
  order.paidAt = new Date();
  order.status = 'confirmed';
  order.paymentResult = { razorpay_order_id, razorpay_payment_id, razorpay_signature, status: 'paid' };
  order.trackingHistory.push({ status: 'confirmed', message: 'Payment received, order confirmed' });
  await order.save();

  res.json({ success: true, message: 'Payment verified', order });
}));

module.exports = router;