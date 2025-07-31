
const mongoose = require('mongoose');

const menuDuJourSchema = new mongoose.Schema({
  restaurantId: {
    type: String,
    required: [true, 'L\'ID du restaurant est requis'],
    default: 'akounamatata_main'
  },
  date: {
    type: Date,
    required: [true, 'La date est requise'],
    default: Date.now
  },
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  statutActif: {
    type: Boolean,
    default: true
  },
  plats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plat'
  }],
  dateCreation: {
    type: Date,
    default: Date.now
  },
  versionWeb: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
menuDuJourSchema.index({ restaurantId: 1, date: -1 });
menuDuJourSchema.index({ statutActif: 1, date: -1 });

// Méthode pour activer le menu
menuDuJourSchema.methods.activer = function() {
  this.statutActif = true;
  return this.save();
};

// Méthode pour désactiver le menu
menuDuJourSchema.methods.desactiver = function() {
  this.statutActif = false;
  return this.save();
};

module.exports = mongoose.model('MenusDuJour', menuDuJourSchema);

