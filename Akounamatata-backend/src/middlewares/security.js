
const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Configuration de la limitation de débit (Rate Limiting)
 */
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
        success: false,
        message: message || 'Trop de requêtes, veuillez réessayer plus tard.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: message || 'Trop de requêtes, veuillez réessayer plus tard.',
            retryAfter: Math.round(windowMs / 1000)
        });
        }
    });
};

/**
 * Limitation générale des API
 */
const generalLimiter = createRateLimit(
    config.security.rateLimitWindowMs, // 15 minutes
    config.security.rateLimitMaxRequests, // 100 requêtes
    'Limite de requêtes atteinte. Réessayez dans 15 minutes.'
);

module.exports = {
    generalLimiter
};