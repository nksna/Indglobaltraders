const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Rice & Grains', 'Dals & Pulses', 'Oils & Ghee',
        'Spices & Masala', 'Flour & Atta', 'Sugar & Salt',
        'Snacks', 'Tea & Coffee', 'Beverages', 'Dairy & Eggs'
      ]
    },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true },
    discount: { type: Number, default: 0 }, // percentage
    unit: { type: String, required: true }, // e.g. "1 kg", "500 g", "1 L"
    stock: { type: Number, required: true, default: 0 },
    images: [{ type: String }],
    brand: { type: String },
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    sku: { type: String, unique: true }
  },
  { timestamps: true }
);

// Auto-calculate discount
productSchema.pre('save', function (next) {
  if (this.mrp && this.price) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);