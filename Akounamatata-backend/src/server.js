
// const app = require('./app.js');
// const config = require('./config');
// const Logger = require('./utils/logger.js');
// const database = require('./config/database.js');

// const PORT = config.port;

// const server = app.listen(PORT, '0.0.0.0', () => async () => {
//   await database.connect()
//   Logger.success(`🚀 Serveur démarré sur le port ${PORT}`);
//   Logger.info(`🌍 Environnement: ${config.nodeEnv}`);
//   Logger.info(`🔗 URL: http://localhost:${PORT}`);
// });

// // Gestion de l'arrêt gracieux
// const gracefulShutdown = (signal) => async () => {
//   Logger.info(`Réception du signal ${signal}. Arrêt gracieux...`);
//   Logger.info('Fermeture de la connexion à la base de données MongoDB...');
//   await database.disconnect()
  
//   server.close(() => {
//     Logger.info('Serveur HTTP fermé.');
//     process.exit(0);
//   });

//   // Force l'arrêt après 10 secondes
//   setTimeout(() => {
//     Logger.error('Arrêt forcé après timeout');
//     process.exit(1);
//   }, 10000);
// };

// process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// module.exports = server;

const app = require('./app.js');
const config = require('./config');
const Logger = require('./utils/logger.js');
const database = require('./config/database.js');

const PORT = config.port;

const startServer = async () => {
  try {
    await database.connect();
    Logger.success('✅ Connexion à la base de données établie');

    const server = app.listen(PORT, '0.0.0.0', () => {
      Logger.success(`🚀 Serveur démarré sur le port ${PORT}`);
      Logger.info(`🌍 Environnement: ${config.nodeEnv}`);
      Logger.info(`🔗 URL: http://localhost:${PORT}`);
    });

    // 🔒 Gestion arrêt gracieux
    const gracefulShutdown = async (signal) => {
      Logger.info(`📴 Signal reçu: ${signal}. Arrêt gracieux...`);

      try {
        await database.disconnect();
        Logger.info('✅ Connexion MongoDB fermée');
      } catch (err) {
        Logger.error('❌ Erreur lors de la fermeture de MongoDB:', err);
      }

      server.close(() => {
        Logger.info('🛑 Serveur HTTP fermé.');
        process.exit(0);
      });

      // Arrêt forcé au cas où
      setTimeout(() => {
        Logger.error('⏱️ Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    module.exports = server;

  } catch (error) {
    Logger.error('❌ Échec du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
