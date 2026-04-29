const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:    { type: String },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

    // ── Pricing ──────────────────────────────────────────────────
    price:    { type: Number, required: true, min: 0 },
    mrp:      { type: Number, required: true },
    discount: { type: Number, default: 0 },         // auto-calculated %

    // ── Images ───────────────────────────────────────────────────
    // Array of image URLs (Unsplash, Cloudinary, etc.)
    // Frontend shows images[0] as the main image; falls back to icon emoji
    images: [{ type: String }],
    icon:   { type: String, default: '🛍️' },        // emoji fallback

    // ── Inventory ────────────────────────────────────────────────
    unit:  { type: String, required: true },         // "1 kg", "S/M/L/XL", "1 piece"
    stock: { type: Number, required: true, default: 0 },

    // ── Meta ─────────────────────────────────────────────────────
    brand:      { type: String },
    tags:       [{ type: String }],
    attributes: { type: Map, of: String },           // size, colour, material, etc.
    isFeatured: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },

    // ── Reviews ──────────────────────────────────────────────────
    reviews:    [reviewSchema],
    rating:     { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Auto-calculate discount percentage
productSchema.pre('save', function (next) {
  if (this.mrp && this.price) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

// Text index for fast full-text search
productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);