const jwt  = require('jsonwebtoken');
const User = require('../models/user');

/**
 * protect — verifies JWT token and attaches req.user
 */
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const token   = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

/**
 * adminOnly — must be used after protect
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ success: false, message: 'Admin access required' });
};

/**
 * generateToken — signs a JWT for a user ID
 */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });

module.exports = { protect, adminOnly, generateToken };