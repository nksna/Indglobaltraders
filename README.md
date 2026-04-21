# INDGLOBAL — Groceries & Daily Essentials
### Full-Stack E-Commerce | Node.js + Express + MongoDB

---

## 🗂 Project Structure

```
indglobal/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (auth, addresses)
│   │   ├── Product.js       # Product schema (reviews, stock)
│   │   ├── Order.js         # Order schema (tracking history)
│   │   ├── Cart.js          # Cart schema
│   │   └── Wishlist.js      # Wishlist schema
│   ├── routes/
│   │   ├── authRoutes.js    # Register, Login, Profile, Addresses
│   │   ├── productRoutes.js # CRUD, Search, Filter, Reviews
│   │   ├── cartRoutes.js    # Add, Update, Remove, Clear
│   │   ├── orderRoutes.js   # Place, Track, Cancel, Admin update
│   │   ├── paymentRoutes.js # Razorpay create + verify
│   │   ├── wishlistRoutes.js# Add/Remove/List wishlist
│   │   └── adminRoutes.js   # Dashboard stats, orders, users
│   ├── middleware/
│   │   └── auth.js          # JWT protect + adminOnly guards
│   ├── server.js            # Express app entry point
│   ├── seed.js              # Database seeder (25 products)
│   ├── .env.example         # Environment variables template
│   └── package.json
└── frontend/
    └── index.html           # Complete SPA (no framework needed)
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas (cloud)

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and Razorpay keys

# Seed the database (25 sample products + admin user)
npm run seed

# Start the server
npm run dev        # development (nodemon)
npm start          # production
```

Backend runs at: **http://localhost:5000**

### 3. Frontend Setup

Simply open `frontend/index.html` in a browser.
No build step required — it's a standalone HTML file.

For production, serve it with any static server:
```bash
npx serve frontend/
```

---

## 🔑 Default Login Credentials (after seeding)

| Role  | Email                   | Password   |
|-------|-------------------------|------------|
| Admin | admin@indglobal.com     | admin123   |
| User  | priya@example.com       | user123    |

---

## 📡 API Reference

### Auth
| Method | Endpoint              | Auth     | Description           |
|--------|-----------------------|----------|-----------------------|
| POST   | /api/auth/register    | Public   | Register new user     |
| POST   | /api/auth/login       | Public   | Login, get JWT token  |
| GET    | /api/auth/me          | User     | Get profile           |
| PUT    | /api/auth/profile     | User     | Update profile        |
| POST   | /api/auth/address     | User     | Add delivery address  |
| DELETE | /api/auth/address/:id | User     | Remove address        |

### Products
| Method | Endpoint                   | Auth     | Description                  |
|--------|----------------------------|----------|------------------------------|
| GET    | /api/products              | Public   | List (filter, search, paginate) |
| GET    | /api/products/categories   | Public   | Category counts              |
| GET    | /api/products/:id          | Public   | Single product               |
| POST   | /api/products/:id/reviews  | User     | Add review                   |
| POST   | /api/products              | Admin    | Create product               |
| PUT    | /api/products/:id          | Admin    | Update product               |
| DELETE | /api/products/:id          | Admin    | Soft-delete product          |

### Cart
| Method | Endpoint            | Auth | Description         |
|--------|---------------------|------|---------------------|
| GET    | /api/cart           | User | Get cart            |
| POST   | /api/cart           | User | Add/update item     |
| DELETE | /api/cart/:productId| User | Remove item         |
| DELETE | /api/cart           | User | Clear cart          |

### Orders
| Method | Endpoint                  | Auth  | Description            |
|--------|---------------------------|-------|------------------------|
| POST   | /api/orders               | User  | Place order            |
| GET    | /api/orders               | User  | My orders              |
| GET    | /api/orders/:id           | User  | Order detail + tracking|
| PUT    | /api/orders/:id/cancel    | User  | Cancel order           |
| PUT    | /api/orders/:id/status    | Admin | Update order status    |

### Payment (Razorpay)
| Method | Endpoint                    | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| POST   | /api/payment/create-order   | User | Create Razorpay order    |
| POST   | /api/payment/verify         | User | Verify payment signature |

### Wishlist
| Method | Endpoint                | Auth | Description      |
|--------|-------------------------|------|------------------|
| GET    | /api/wishlist           | User | Get wishlist     |
| POST   | /api/wishlist/:productId| User | Add to wishlist  |
| DELETE | /api/wishlist/:productId| User | Remove from wishlist |

### Admin
| Method | Endpoint                      | Auth  | Description          |
|--------|-------------------------------|-------|----------------------|
| GET    | /api/admin/stats              | Admin | Dashboard analytics  |
| GET    | /api/admin/orders             | Admin | All orders           |
| GET    | /api/admin/users              | Admin | All customers        |
| PUT    | /api/admin/users/:id/toggle   | Admin | Activate/deactivate  |
| GET    | /api/admin/low-stock          | Admin | Low stock alerts     |

---

## 🧠 Key Features

### Customer Features
- 🔐 JWT Authentication (register/login/profile)
- 🛒 Persistent cart (synced with backend)
- ❤️ Wishlist management
- 🔍 Search & filter by category, price, featured
- 📦 Order placement (Razorpay + COD)
- 📍 Multiple delivery addresses
- 📊 Order tracking with full history timeline
- ⭐ Product reviews & ratings

### Admin Features
- 📈 Dashboard: revenue, orders, products, customers
- 📋 Order management with status updates
- 🛑 Low-stock alerts
- 👥 Customer management (activate/deactivate)
- 🗂 Product CRUD (create, update, soft-delete)

### Business Logic
- Free delivery above ₹499
- 5% GST calculated automatically
- Stock deducted on order, restored on cancellation
- Discount % auto-calculated from MRP vs price
- Order numbers auto-generated (e.g. IND7421490001)
- Razorpay signature verification for payment security

---

## 🚀 Production Deployment

### Backend (Railway / Render / EC2)
1. Set environment variables on your platform
2. Use MongoDB Atlas for cloud database
3. Run `npm start`

### Frontend (Vercel / Netlify / S3)
1. Update `const API = 'https://your-api-domain.com/api'` in `index.html`
2. Deploy the `frontend/` folder

### Razorpay Setup
1. Create account at https://razorpay.com
2. Get Key ID and Secret from Dashboard → Settings → API Keys
3. Add to `.env`

---

## 🔧 Extending the App

### Add new product category
- Add to the `enum` array in `models/Product.js`
- Add icon in frontend `catIcons` object

### Add email notifications
- Install `nodemailer`
- Trigger on order placement and status change in `orderRoutes.js`

### Add image uploads
- `multer` is already in dependencies
- Create an upload route and store to S3 or local `/uploads`
