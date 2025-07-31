
const compression = require('compression');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const corsMiddleware = require('./middlewares/cors');
const config = require('./config');
const { generalLimiter } = require('./middlewares/security');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Middlewares de sécurité
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(corsMiddleware);

// Middlewares généraux
app.use(compression());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Middleware pour ajouter des headers de sécurité
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Routes de l'API
app.use('/api/health', require('./modules/health/health.route.js'));
app.use('/api/auth', require('./modules/auth/auth.route.js'));
app.use('/api/users', require('./modules/user/user.route.js'));
app.use('/api/categories', require('./modules/categorie/categorie.route.js'));
app.use('/api/commandes', require('./modules/commande/commande.route.js'));
app.use('/api/menus', require('./modules/menuDuJour/menuDuJour.route.js'));
app.use('/api/paniers', require('./modules/panier/panier.route.js'));
app.use('/api/plats', require('./modules/plat/plat.route.js'));
app.use('/api/table', require('./modules/table/table.route.js'));

// Route racine
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Backend API Restauration',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            users: '/api/users',
            categories: '/api/categories',
            commandes: '/api/commandes',
            menus: '/api/menus',
            paniers: '/api/paniers',
            plats: '/api/plats',
            tables: '/api/table'
        }
    });
});

// Middleware de gestion des erreurs 404
app.use(notFoundHandler);

// Middleware de gestion des erreurs générales
app.use(errorHandler);

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});

module.exports = app;