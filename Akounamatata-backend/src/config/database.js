
const mongoose = require('mongoose');

const config = require('./index.js');
const Logger = require('../utils/logger.js');

/**
 * Configuration et connexion à la base de données MongoDB
 */
class Database {
    constructor() {
        this.connection = null;
    }

    /**
     * Établit la connexion à MongoDB
     */
    async connect() {
        try {
            const mongoUri = config.database.mongodbUri;
            
            const options = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 60000,
                bufferCommands: false,
            };

            this.connection = await mongoose.connect(mongoUri, options);
            
            Logger.success(`✅ MongoDB connecté: ${this.connection.connection.host}`);
            
            // Gestion des événements de connexion
            mongoose.connection.on('error', (err) => {
                Logger.error('❌ Erreur MongoDB:', err);
            });

            mongoose.connection.on('disconnected', () => {
                Logger.warn('⚠️ MongoDB déconnecté');
            });

            // Gestion de l'arrêt propre
            process.on('SIGINT', this.disconnect.bind(this));
            process.on('SIGTERM', this.disconnect.bind(this));

            return this.connection;
        } catch (error) {
            Logger.error('❌ Erreur de connexion MongoDB:', error);
            process.exit(1);
        }
    }

    /**
     * Ferme la connexion à MongoDB
     */
    async disconnect() {
        try {
            await mongoose.connection.close();
            Logger.success('✅ Connexion MongoDB fermée proprement');
            process.exit(0);
        } catch (error) {
            Logger.error('❌ Erreur lors de la fermeture de MongoDB:', error);
            process.exit(1);
        }
    }

    /**
     * Vérifie l'état de la connexion
     */
    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

module.exports = new Database();

