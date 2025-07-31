
const mongoose = require('mongoose');

const panierItemSchema = new mongoose.Schema({
  platId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plat',
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

const panierSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'ID du client est requis']
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
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
panierSchema.pre('save', function(next) {
  this.dateModification = new Date();
  next();
});

// Méthode pour calculer le total
panierSchema.methods.calculerTotal = async function() {
  await this.populate('items.platId', 'disponible');

  this.total = this.items.reduce((total, item) => {
    const plat = item.platId;
    const disponible = plat && plat.disponible;

    return disponible ? total + (item.quantite * item.prixUnitaire) : total;
  }, 0);

  return this.total;
};

// Méthode pour ajouter un item
panierSchema.methods.ajouterItem = async function(platId, quantite, prixUnitaire, commentaires = '') {
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
  
  await this.calculerTotal();
  return await this.save();
};

// Méthode pour retirer un item
panierSchema.methods.retirerItem = async function(platId) {
  this.items = this.items.filter(item => item.platId.toString() !== platId.toString());
  await this.calculerTotal();
  return await this.save();
};

// Méthode pour vider le panier
panierSchema.methods.vider = async function() {
  this.items = [];
  this.total = 0;
  return await this.save();
};

// Index pour optimiser les requêtes
panierSchema.index({ clientId: 1, actif: 1 });
panierSchema.index({ tableId: 1, actif: 1 });

module.exports = mongoose.model('Panier', panierSchema);

