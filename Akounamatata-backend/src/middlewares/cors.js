const cors = require('cors');
const config = require('../config');

const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // En développement, permettre toutes les origines
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    // En production, vérifier l'origine
    const allowedOrigins = [config.corsOrigin, config.app.url];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

module.exports = cors(corsOptions);

