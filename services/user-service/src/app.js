require('dotenv').config({ path: './config.env' });

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// This middleware removes dangerous Mongo operators like $gt.
const mongoSanitize = require('express-mongo-sanitize');
// This middleware removes dangerous HTML tags and attributes to prevent XSS attacks.
const { clean: cleanXss } = require('xss-clean/lib/xss');
// This middleware prevents HTTP parameter pollution attacks.
const hpp = require('hpp');

const connectDB = require('./config/db');
const validateEnv = require('./config/validateEnv');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');

const app = express();
// Needed when app runs behind a reverse proxy like Nginx or when deployed to platforms like Heroku. 
// It allows Express to correctly identify the client's IP address and protocol (HTTP vs HTTPS).
// important for rate limiting
app.set('trust proxy', 1);

// ========================
// 1) GLOBAL MIDDLEWARES
// ========================

// Security headers
app.use(helmet());

// Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting - limit each IP to 100 requests per hour on all /api routes
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true, 
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, try again in an hour'
  }
});

// Apply rate limiting to all /api routes. We can exclude non-API routes like /health if needed.
app.use('/api', limiter);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10kb' }));

// Lightweight cookie parsing so auth controllers can read req.cookies.refreshToken.
// we could have used the cookie-parser package, but it adds a lot of extra functionality we don't need. 
// This simple middleware is enough for our use case and avoids an extra dependency.
app.use((req, res, next) => {
  req.cookies = {};

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return next();

  cookieHeader.split(';').forEach((cookie) => {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex === -1) return;

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();
    if (!name) return;

    try {
      req.cookies[name] = decodeURIComponent(value);
    } catch (err) {
      req.cookies[name] = value;
    }
  });

  next();
});

// Data sanitization against NoSQL query injection.
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

// Data sanitization against XSS.
app.use((req, res, next) => {
  if (req.body) req.body = cleanXss(req.body);
  if (req.params) req.params = cleanXss(req.params);
  next();
});

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['role'] // keep minimal for now
  })
);

// ========================
// 2) ROUTES
// ========================

// health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'User service is running'
  });
});

// mount user routes
app.use('/api/v1/users', userRouter);

// ========================
// 3) UNHANDLED ROUTES
// ========================
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// ========================
// 4) GLOBAL ERROR HANDLER
// ========================
app.use(globalErrorHandler);

// ========================
// 5) START SERVER
// ========================
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    app.listen(PORT, () => {
      console.log(`User service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
