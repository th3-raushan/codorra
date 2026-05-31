const jwt = require('jsonwebtoken');
const User = require('../models/users');

// Soft auth: attaches req.user if a valid token is present, but does NOT block
// the request if no token is provided. Use this for routes that work for both
// authenticated and unauthenticated users (e.g., verify — save to history if logged in).
const softProtect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Token invalid/expired — continue as unauthenticated
            req.user = null;
        }
    }
    next();
};

module.exports = { softProtect };
