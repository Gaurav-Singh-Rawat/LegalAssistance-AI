require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || '*')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Render forwards the original client IP in X-Forwarded-For.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Initialize Database connection
connectDB();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: (requestOrigin, callback) => {
    const normalizedRequestOrigin = requestOrigin?.replace(/\/$/, '');
    if (!normalizedRequestOrigin || allowedOrigins.includes('*') || allowedOrigins.includes(normalizedRequestOrigin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('dev'));

// Apply General Rate Limiter to all API routes
app.use('/api', generalLimiter);

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the GenAI Legal Information Assistant API',
    documentation: '/api/health',
    version: '1.0.0',
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 Legal AI Backend running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=============================================`);
});
