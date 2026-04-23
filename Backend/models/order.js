const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, unique: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String, icon: String, price: Number, unit: String, quantity: Number
      }
    ],
    shippingAddress: {
      fullName: String, phone: String,
      addressLine1: String, addressLine2: String,
      city: String, state: String, pincode: String
    },
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
    paymentResult: { razorpay_order_id: String, razorpay_payment_id: String, razorpay_signature: String, status: String },
    itemsPrice: Number, shippingPrice: Number, taxPrice: Number, totalPrice: Number,
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending'
    },
    trackingHistory: [{ status: String, message: String, timestamp: { type: Date, default: Date.now } }],
    estimatedDelivery: Date,
    notes: String
  },
  { timestamps: true }
);
 
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `IND${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});
 module.exports = mongoose.model('Order', orderSchema);