const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getTokenFromRequest = (req) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice(7).trim();
};

const verifyUserToken = async (req) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.id).select('-password');
};

const protect = async (req, res, next) => {
  try {
    const user = await verifyUserToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const user = await verifyUserToken(req);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Anonymous requests remain supported for guest uploads and legacy documents.
  }

  next();
};

module.exports = { protect, optionalAuth };
