const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const paymentRouter = express.Router();
const crypto = require('crypto');
paymentRouter.use(protect);
 
paymentRouter.post('/create-order', asyncHandler(async (req, res) => {
  const Razorpay = require('razorpay');
  const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  const order = await Order.findById(req.body.orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  const rzOrder = await rz.orders.create({ amount: Math.round(order.totalPrice * 100), currency: 'INR', receipt: order.orderNumber });
  order.paymentResult = { razorpay_order_id: rzOrder.id, status: 'created' };
  await order.save();
  res.json({ success: true, razorpayOrderId: rzOrder.id, amount: rzOrder.amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID });
}));
 
paymentRouter.post('/verify', asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  const sig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (sig !== razorpay_signature) return res.status(400).json({ success: false, message: 'Verification failed' });
  const order = await Order.findById(orderId);
  order.isPaid = true; order.paidAt = new Date(); order.status = 'confirmed';
  order.paymentResult = { razorpay_order_id, razorpay_payment_id, razorpay_signature, status: 'paid' };
  order.trackingHistory.push({ status: 'confirmed', message: 'Payment received' });
  await order.save();
  res.json({ success: true, order });
}));