const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    slug:        { type: String, unique: true, lowercase: true },
    icon:        { type: String, default: '🛍️' },
    color:       { type: String, default: '#7c3aed' },
    description: { type: String, default: '' },
    isActive:    { type: Boolean, default: true },
    sortOrder:   { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Auto-generate slug from name
categorySchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);