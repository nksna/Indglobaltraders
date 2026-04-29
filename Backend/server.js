const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
 
const app = express();
const allowedOrigins = [
  'https://indglobaltrader.netlify.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  process.env.FRONTEND_URL
].filter(Boolean);
 
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
 
// ── MIDDLEWARE ───────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 
// Serve uploaded files if you add local file upload later
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 
// ── REQUEST LOGGER (dev only) ────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

const { authRouter, cartRouter, orderRouter, wishlistRouter, adminRouter, paymentRouter } = require('./routes/allRoutes');
app.use('/api/auth', authRouter);
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payment', paymentRouter);
app.get('/api/health', (_req, res) => {
  res.json({
    status:  'OK',
    app:     'INDGLOBAL Marketplace API v3',
    time:    new Date().toISOString(),
    db:      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
 
// ── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
 
// ── GLOBAL ERROR HANDLER ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Error:', err.message);
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});
 
// ── CONNECT & LISTEN ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
 
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 INDGLOBAL API running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
 module.exports = app;