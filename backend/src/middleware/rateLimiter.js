const rateLimit = require('express-rate-limit');

/**
 * Standard 429 handler response
 */
const createLimiterHandler = (customMessage) => {
  return (req, res) => {
    res.status(429).json({
      success: false,
      message: customMessage || 'Too many requests from this IP. Please try again in a few minutes.',
      retryAfterSeconds: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) || 60,
    });
  };
};

/**
 * General API Limiter (applies to all endpoints)
 * Limit: 120 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120,
  standardHeaders: true, // Return standard RateLimit headers (RateLimit-Limit, RateLimit-Remaining)
  legacyHeaders: false,
  handler: createLimiterHandler('Too many requests. Please slow down and try again shortly.'),
});

/**
 * Document Upload Limiter (prevents disk & embedding spam)
 * Limit: 15 document uploads per 15 minutes
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler('Upload limit reached (15 uploads per 15 minutes). Please wait before uploading more documents.'),
});

/**
 * AI Q&A & Re-Analyze Limiter (protects Gemini LLM token quota)
 * Limit: 30 AI questions / requests per 15 minutes
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler('AI request limit reached. Please wait a few minutes before asking more questions.'),
});

module.exports = {
  generalLimiter,
  uploadLimiter,
  aiLimiter,
};
