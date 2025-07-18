const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier le token JWT
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');
    
    if (!user) {
      return res.status(401).json({ message: 'Token invalide.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide.' });
  }
};

// Middleware pour vérifier le rôle admin
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Privilèges administrateur requis.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur de vérification des privilèges.' });
  }
};

// Middleware pour vérifier le rôle client
const clientAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Accès refusé. Privilèges client requis.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur de vérification des privilèges.' });
  }
};

// Middleware pour vérifier que l'utilisateur peut accéder à ses propres données
const ownerAuth = async (req, res, next) => {
  try {
    const userId = req.params.id || req.params.userId || req.params.clientId;
    
    if (req.user.role === 'admin' || req.user._id.toString() === userId) {
      next();
    } else {
      return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres données.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur de vérification des privilèges.' });
  }
};

module.exports = {
  auth,
  adminAuth,
  clientAuth,
  ownerAuth
};

