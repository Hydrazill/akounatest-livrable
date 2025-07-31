
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        trim: true
    },
    telephone: {
        type: String,
        required: [true, 'Le téléphone est requis'],
        trim: true
    },
    motDePasse: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['client', 'admin', 'gestionnaire'],
        default: 'client'
    },
    dateCreation: {
        type: Date,
        default: Date.now
    },
    dernierAcces: {
        type: Date,
        default: Date.now
    },
    // Champs spécifiques aux clients
    sessionId: {
        type: String,
        default: null
    },
    tableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        default: null
    },
    historiqueCommandes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commande'
    }],
    preferences: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    },
    // Champs spécifiques aux gestionnaires
    restaurantId: {
        type: String,
        default: null
    },
    permissions: [{
        type: String
    }],
    notifications: [{
        message: String,
        type: String,
        date: { type: Date, default: Date.now },
        lu: { type: Boolean, default: false }
    }]
}, {
    timestamps: true
});

// Middleware pour hacher le mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  
  try {
        const salt = await bcrypt.genSalt(12);
        this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
        next();
  } catch (error) {
        next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.motDePasse);
};

// Méthode pour mettre à jour le dernier accès
userSchema.methods.updateLastAccess = function() {
    this.dernierAcces = new Date();
    return this.save();
};

module.exports = mongoose.model('User', userSchema);

