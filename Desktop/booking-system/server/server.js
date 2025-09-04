require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const whatsappRoutes = require('./routes/whatsapp');
const paymentsRoutes = require('./routes/payments');
const publicRoutes = require('./routes/public');
const apiRoutes = require('./routes/api');
const { cleanExpiredHolds } = require('./services/booking');

const app = express();
const PORT = process.env.PORT || 3000;

// FIXED: Configure trust proxy properly for development
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy in production
} else {
  // For development with ngrok, trust the proxy but configure rate limiting differently
  app.set('trust proxy', true);
}
// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// UPDATED: Rate limiting with proper configuration for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP',
  // FIXED: Skip rate limiting in development to avoid ngrok issues
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});
app.use(limiter);

// UPDATED: Webhook rate limiting 
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many webhook requests',
  // FIXED: Skip rate limiting in development
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// Body parsing middleware
app.use('/webhooks', webhookLimiter);

// Special parsing for WhatsApp (Twilio sends form data)
app.use('/webhooks/whatsapp', express.urlencoded({ extended: true }));
app.use('/webhooks/payments', express.raw({ type: 'application/json' }));

// General JSON parsing for API routes
app.use(express.json());

// Routes
app.use('/webhooks', whatsappRoutes);
app.use('/webhooks', paymentsRoutes);
app.use('/api', apiRoutes);
app.use('/public', publicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler (Express v5: avoid '*' wildcard; use pathless middleware)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Clean expired holds every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    await cleanExpiredHolds();
    console.log('Cleaned expired holds');
  } catch (error) {
    console.error('Error cleaning expired holds:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});