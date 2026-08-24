const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./constant");

/**
 * Generate JWT token with default 7-day expiration
 * @param {Object} payload 
 * @returns {string} Signed JWT token
 */
const generateJwtToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

/**
 * Verify and decode JWT token
 * @param {string} token 
 * @returns {Object} Decoded payload
 */
const verifyJwtToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = {
    generateJwtToken,
    verifyJwtToken
};