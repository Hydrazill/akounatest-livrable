
const mongoose = require('mongoose');

const platSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du plat est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: 0
  },
  devise: {
    type: String,
    default: 'FCFA'
  },
  imageUrl: {
    type: String,
    default: null
  },
  categorieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie',
    required: [true, 'La catégorie est requise']
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergenes: [{
    type: String,
    trim: true
  }],
  valeurNutritionnelle: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  tempsPreparation: {
    type: Number,
    default: 0, // en minutes
    min: 0
  },
  disponible: {
    type: Boolean,
    default: true
  },
  anecdotesCourtes: [{
    type: String,
    trim: true
  }],
  anecdotesCompletes: [{
    type: String,
    trim: true
  }],
  restaurantId: {
    type: String,
    required: [true, 'L\'ID du restaurant est requis'],
    default: 'akounamatata_main'
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
platSchema.index({ categorieId: 1, disponible: 1 });
platSchema.index({ restaurantId: 1, disponible: 1 });

module.exports = mongoose.model('Plat', platSchema);

