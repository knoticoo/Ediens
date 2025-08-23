// [EDIT] - 2024-01-15 - Created security middleware - Ediens Team
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Rate limiting for general API endpoints
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for file uploads
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// CSRF protection middleware (simplified)
const csrfProtection = (req, res, next) => {
  // Basic CSRF protection using Origin header check
  const origin = req.headers.origin;
  const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
  
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    if (!origin || !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: 'CSRF protection: Invalid origin' });
    }
  }
  
  next();
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  };

  // Sanitize body parameters
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  next();
};

// Account lockout middleware
const accountLockout = new Map();

const checkAccountLockout = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const lockoutInfo = accountLockout.get(ip);

  if (lockoutInfo && lockoutInfo.count >= 5 && (now - lockoutInfo.firstAttempt) < 15 * 60 * 1000) {
    return res.status(429).json({
      error: 'Account temporarily locked due to too many failed attempts',
      retryAfter: Math.ceil((15 * 60 * 1000 - (now - lockoutInfo.firstAttempt)) / 1000)
    });
  }

  next();
};

const recordFailedAttempt = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const lockoutInfo = accountLockout.get(ip) || { count: 0, firstAttempt: now };

  lockoutInfo.count++;
  if (lockoutInfo.count === 1) {
    lockoutInfo.firstAttempt = now;
  }

  accountLockout.set(ip, lockoutInfo);

  // Clean up old entries
  if (now - lockoutInfo.firstAttempt > 15 * 60 * 1000) {
    accountLockout.delete(ip);
  }

  next();
};

module.exports = {
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  csrfProtection,
  securityHeaders,
  sanitizeInput,
  checkAccountLockout,
  recordFailedAttempt
};