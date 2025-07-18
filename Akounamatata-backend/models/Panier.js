const mongoose = require('mongoose');

const panierItemSchema = new mongoose.Schema({
  platId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'plats',
    required: true
  },
  quantite: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  prixUnitaire: {
    type: Number,
    required: true,
    min: 0
  },
  commentaires: {
    type: String,
    trim: true,
    default: ''
  }
});

const Panier = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'L\'ID du client est requis']
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'tables',
    required: [true, 'L\'ID de la table est requis']
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  devise: {
    type: String,
    default: 'FCFA'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  },
  actif: {
    type: Boolean,
    default: true
  },
  items: [panierItemSchema]
}, {
  timestamps: true
});

// Middleware pour mettre à jour la date de modification
Panier.pre('save', function(next) {
  this.dateModification = new Date();
  next();
});

// Méthode pour calculer le total
Panier.methods.calculerTotal = function() {
  this.total = this.items.reduce((total, item) => {
    return total + (item.quantite * item.prixUnitaire);
  }, 0);
  return this.total;
};

// Méthode pour ajouter un item
Panier.methods.ajouterItem = function(platId, quantite, prixUnitaire, commentaires = '') {
  const existingItem = this.items.find(item => item.platId.toString() === platId.toString());
  
  if (existingItem) {
    existingItem.quantite += quantite;
    if (commentaires) {
      existingItem.commentaires = commentaires;
    }
  } else {
    this.items.push({
      platId,
      quantite,
      prixUnitaire,
      commentaires
    });
  }
  
  this.calculerTotal();
  return this.save();
};

// Méthode pour retirer un item
Panier.methods.retirerItem = function(platId) {
  this.items = this.items.filter(item => item.platId.toString() !== platId.toString());
  this.calculerTotal();
  return this.save();
};

// Méthode pour vider le panier
Panier.methods.vider = function() {
  this.items = [];
  this.total = 0;
  return this.save();
};

// Index pour optimiser les requêtes
Panier.index({ clientId: 1, actif: 1 });
Panier.index({ tableId: 1, actif: 1 });

module.exports = mongoose.model('paniers', Panier);

