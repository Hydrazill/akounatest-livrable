
const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  iconUrl: {
    type: String,
    default: null
  },
  ordre: {
    type: Number,
    default: 0
  },
  restaurantId: {
    type: String,
    required: [true, 'L\'ID du restaurant est requis'],
    default: 'akounamatata_main'
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
categorieSchema.index({ restaurantId: 1, ordre: 1 });

module.exports = mongoose.model('Categorie', categorieSchema);

