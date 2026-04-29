const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName:     { type: String },
  phone:        { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  city:         { type: String },
  state:        { type: String },
  pincode:      { type: String },
  isDefault:    { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:     { type: String, trim: true },
    password:  { type: String, required: true, minlength: 6 },
    role:      { type: String, enum: ['user', 'admin'], default: 'user' },
    addresses: [addressSchema],
    avatar:    { type: String, default: '' },   // URL of profile picture (optional)
    isActive:  { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Hash password on save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);