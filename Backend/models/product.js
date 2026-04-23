const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    unit: { type: String, required: true },       // "1 kg", "M/L/XL", "1 piece"
    stock: { type: Number, required: true, default: 0 },
    images: [{ type: String }],
    icon: { type: String, default: '🛍️' },        // emoji fallback
    brand: String,
    tags: [String],
    attributes: { type: Map, of: String },         // flexible: { size, color, material, flavour… }
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    sku: { type: String, sparse: true }   // no unique index — avoids null collision
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  if (this.mrp && this.price) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);