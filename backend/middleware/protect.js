const jwt = require('jsonwebtoken');

// Base Authentication verification check
const verifyAppToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access Denied: Token missing.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ message: 'Access Denied: Token malformed.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your_fallback_secret_key';
    const verified = jwt.verify(token, secret);

    const userId = verified.id || verified._id;
    const userCategory = verified.category || verified.department || null;

    // Map properties safely (including category for socket/controller routing)
    req.user = {
      id: userId,
      _id: userId,
      name: verified.name,
      email: verified.email,
      role: verified.role,
      category: userCategory,
      department: userCategory, // Backward compatibility fallback
    };

    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(401).json({ message: 'Session expired or token invalid.' });
  }
};

// Flexible Role Authorization Guard (Case-Insensitive & Trimmed)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Forbidden: User identity or role missing.' });
    }

    const userRole = String(req.user.role).trim().toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((role) => String(role).trim().toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.warn(
        `⛔ [403 BLOCKED] User ID: ${req.user.id} | Token Role: "${req.user.role}" | Required: [${allowedRoles.join(', ')}]`
      );
      return res.status(403).json({
        message: `Forbidden: Access requires one of: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = {
  verifyAppToken,
  authorizeRoles,
};