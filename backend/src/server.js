const https = require('https');
const fs = require('fs');
const path = require('path');

const app = require('./app.js');
const config = require('./config');
const Logger = require('./utils/logger.js');
const database = require('./config/database.js');

const PORT = config.port;

// 📁 Chemins vers les certificats SSL (à adapter selon ton projet)
// const sslOptions = {
//   key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
//   cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
// };

const startServer = async () => {
  try {
    await database.connect();
    Logger.success('✅ Connexion à la base de données établie');

    // const server = https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
    //   Logger.success(`🚀 Serveur HTTPS démarré sur le port ${PORT}`);
    //   Logger.info(`🌍 Environnement: ${config.nodeEnv}`);
    //   Logger.info(`🔗 URL: https://localhost:${PORT}`);
    // });
    app.listen(PORT, '0.0.0.0', () => {
      Logger.success(`🚀 Serveur HTTPS démarré sur le port ${PORT}`);
      Logger.info(`🌍 Environnement: ${config.nodeEnv}`);
      Logger.info(`🔗 URL: https://localhost:${PORT}`);
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

      // server.close(() => {
      //   Logger.info('🛑 Serveur HTTPS fermé.');
      //   process.exit(0);
      // });

      // Arrêt forcé au cas où
      setTimeout(() => {
        Logger.error('⏱️ Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // module.exports = server;

  } catch (error) {
    Logger.error('❌ Échec du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
