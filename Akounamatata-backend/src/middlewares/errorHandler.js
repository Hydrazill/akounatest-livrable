const config = require('../config');
const Logger = require('../utils/logger')

// Middleware de gestion des erreurs 404
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Middleware de gestion des erreurs générales
const errorHandler = (error, req, res, next) => {
  let statusCode = error.status || error.statusCode || 500;
  let message = error.message || 'Erreur interne du serveur';

  // Erreurs de validation
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Données de validation incorrectes';
  }

  // Erreurs de taux limite
  if (error.status === 429) {
    statusCode = 429;
    message = error.message || 'Trop de requêtes';
  }

  // Log des erreurs en développement
  if (config.nodeEnv === 'development') {
    Logger.error('Error:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Réponse d'erreur
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(config.nodeEnv === 'development' && { stack: error.stack })
    }
  });
};

// Middleware pour capturer les erreurs async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};


module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler
};