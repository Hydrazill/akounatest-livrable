const mongoose = require('mongoose');

const Table = new mongoose.Schema({
  numero: {
    type: String,
    required: [true, 'Le numéro de table est requis'],
    unique: true,
    trim: true
  },
  capacite: {
    type: Number,
    required: [true, 'La capacité est requise'],
    min: 1,
    max: 20
  },
  restaurantId: {
    type: String,
    required: [true, 'L\'ID du restaurant est requis'],
    default: 'akounamatata_main'
  },
  qrCode: {
    type: String,
    unique: true
  },
  statutOccupee: {
    type: Boolean,
    default: false
  },
  dateOccupation: {
    type: Date,
    default: null
  },
  clientActuel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    default: null
  }
}, {
  timestamps: true
});

// Méthode pour générer un QR code unique
Table.methods.generateQRCode = function() {
  this.qrCode = `table_${this._id}_${Date.now()}`;
  return this.save();
};

// Méthode pour occuper la table
Table.methods.occuper = function(clientId) {
  this.statutOccupee = true;
  this.dateOccupation = new Date();
  this.clientActuel = clientId;
  return this.save();
};

// Méthode pour libérer la table
Table.methods.liberer = function() {
  this.statutOccupee = false;
  this.dateOccupation = null;
  this.clientActuel = null;
  return this.save();
};

module.exports = mongoose.model('tables', Table);

