const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware de sécurité
app.use(helmet());

// Middleware de logging
app.use(morgan('combined'));

// Middleware CORS
app.use(cors({
  origin: '*', // Permettre toutes les origines pour le développement
  credentials: true
}));

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI,
  // {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  // }
)
.then(() => console.log('Connexion à MongoDB réussie'))
.catch((error) => console.error('Erreur de connexion à MongoDB:', error));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/menus', require('./routes/menus'));
app.use('/api/plats', require('./routes/plats'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/paniers', require('./routes/paniers'));
app.use('/api/commandes', require('./routes/commandes'));
app.use('/api/admin', require('./routes/admin'));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API AKOUNAMATATA fonctionne!' });
});

// Middleware de gestion d'erreurs
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : {}
  });
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;

