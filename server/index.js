const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

const createContentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 creations per window
  message: { error: 'Too many submissions, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: { error: 'Too many messages, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://vliewarden.nl',
  'https://www.vliewarden.nl',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(null, true); // Allow all origins in case of issues
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database initialization
const db = require('./database/db');

// Apply general rate limiter to all API routes
app.use('/api', generalLimiter);

// Routes with specific rate limiters
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/districts', require('./routes/districts'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/upload', createContentLimiter, require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', messageLimiter, require('./routes/messages'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize database and start server
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

