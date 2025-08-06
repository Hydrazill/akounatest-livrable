
require('dotenv').config();

const config = {
    port: parseInt(process.env.PORT),
    nodeEnv: process.env.NODEENV,
    corsOrigin: process.env.CORSORIGIN,

    app: {
        url: process.env.APPURL,
    },

    database: {
        mongodbUri: process.env.MONGODBURI,
    },

    jwt: {
        jwtSecret: process.env.JWTSECRET,
        jwtExpire: process.env.JWTEXPIRE,
    },

    // Configuration de sécurité
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS),
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
    },
}

module.exports = config;