
const mongoose = require('mongoose');

const commandeItemSchema = new mongoose.Schema({
  platId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plat',
    required: true
  },
  nom: {
    type: String,
    required: true
  },
  quantite: {
    type: Number,
    required: true,
    min: 1
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

const commandeSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true
  },
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
  menuDuJourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenusDuJour',
    default: null
  },
  sousTotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxes: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  devise: {
    type: String,
    default: 'FCFA'
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmee', 'en_preparation', 'prete', 'livree', 'annulee'],
    default: 'en_attente'
  },
  dateCommande: {
    type: Date,
    default: Date.now
  },
  dateConfirmation: {
    type: Date,
    default: null
  },
  dateLivraison: {
    type: Date,
    default: null
  },
  commentaires: {
    type: String,
    trim: true,
    default: ''
  },
  modeCommande: {
    type: String,
    enum: ['sur_place', 'emporter'],
    default: 'sur_place'
  },
  items: [commandeItemSchema],
  historique: [{
    statut: String,
    date: { type: Date, default: Date.now },
    commentaire: String
  }]
}, {
  timestamps: true
});

// Middleware pour générer un numéro de commande unique
commandeSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    const count = await this.constructor.countDocuments();
    this.numero = `CMD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Méthode pour changer le statut
commandeSchema.methods.changerStatut = function(nouveauStatut, commentaire = '') {
  const ancienStatut = this.statut;
  this.statut = nouveauStatut;
  
  // Ajouter à l'historique
  this.historique.push({
    statut: nouveauStatut,
    commentaire: commentaire || `Changement de statut: ${ancienStatut} -> ${nouveauStatut}`
  });
  
  // Mettre à jour les dates spécifiques
  if (nouveauStatut === 'confirmee' && !this.dateConfirmation) {
    this.dateConfirmation = new Date();
  } else if (nouveauStatut === 'livree' && !this.dateLivraison) {
    this.dateLivraison = new Date();
  }
  
  return this.save();
};

// Méthode pour calculer le total
commandeSchema.methods.calculerTotal = function() {
  this.sousTotal = this.items.reduce((total, item) => {
    return total + (item.quantite * item.prixUnitaire);
  }, 0);
  
  // Calculer les taxes (par exemple 18% de TVA)
  this.taxes = this.sousTotal * 0.18;
  this.total = this.sousTotal + this.taxes;
  
  return this.total;
};

// Index pour optimiser les requêtes
commandeSchema.index({ clientId: 1, dateCommande: -1 });
commandeSchema.index({ tableId: 1, dateCommande: -1 });
commandeSchema.index({ statut: 1, dateCommande: -1 });
commandeSchema.index({ numero: 1 });

module.exports = mongoose.model('Commande', commandeSchema);

