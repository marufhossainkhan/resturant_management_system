const { verifyJwtToken } = require("../util/helper");

/**
 * Middleware to verify JWT token in Authorization header
 */
const verifyAuth = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        let token = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token missing. Please log in."
            });
        }

        const decoded = verifyJwtToken(token);
        req.user = decoded; // { userId, email, fullName, role }
        next();
    } catch (ex) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again."
        });
    }
};

/**
 * Optional authentication: populates req.user if token is present, but does not block guests
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        let token = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (req.query && req.query.token) {
            token = req.query.token;
        }

        if (token) {
            const decoded = verifyJwtToken(token);
            req.user = decoded;
        } else {
            req.user = null;
        }
    } catch (ex) {
        req.user = null;
    }
    next();
};

/**
 * Role-based access control middleware
 * @param {Array<string>} allowedRoles 
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Authentication required."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden. Requires one of the following roles: ${allowedRoles.join(", ")}`
            });
        }

        next();
    };
};

module.exports = {
    verifyAuth,
    optionalAuth,
    requireRoles
};
