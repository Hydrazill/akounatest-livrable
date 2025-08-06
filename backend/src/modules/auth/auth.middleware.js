const jwt = require('jsonwebtoken');

const config = require('../../config');
const User = require('../user/user.model');
const Logger = require('../../utils/logger');
const { createResponse } = require('../../utils/helpers');

// Middleware pour vérifier le token JWT
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json(createResponse(false, {}, 'Accès refusé. Token manquant.'));
    }

    const decoded = jwt.verify(token, config.jwt.jwtSecret); // JWTSECRET (sans underscore)
    const user = await User.findById(decoded.id).select('-motDePasse');

    if (!user) {
      return res.status(401).json(createResponse(false, {}, 'Token invalide.'));
    }

    req.user = user;

    Logger.success('Authentification réussie', { userId: user._id, role: user.role });

    next();
  } catch (error) {
    res.status(401).json(createResponse(false, {}, 'Token invalide.'));
  }
};

// Middleware pour vérifier le rôle admin
const adminAuth = (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(createResponse(false, {}, 'Accès refusé. Privilèges administrateur requis.'));
    }

    Logger.success('Accès administrateur validé', { userId: req.user._id });

    next();
  } catch (error) {
    res.status(500).json(createResponse(false, {}, 'Erreur de vérification des privilèges.'));
  }
};

// Middleware pour vérifier le rôle client
const clientAuth = (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json(createResponse(false, {}, 'Accès refusé. Privilèges client requis.'));
    }

    Logger.success('Accès client validé', { userId: req.user._id });

    next();
  } catch (error) {
    res.status(500).json(createResponse(false, {}, 'Erreur de vérification des privilèges.'));
  }
};

// Middleware pour vérifier que l'utilisateur peut accéder à ses propres données
const ownerAuth = (req, res, next) => {
  try {
    const userId = req.params.id || req.params.userId || req.params.clientId;

    if (req.user.role === 'admin' || req.user._id.toString() === userId) {
      Logger.success('Vérification propriétaire réussie', { userId: req.user._id, targetId: userId });
      return next();
    } else {
      return res.status(403).json(
        createResponse(false, {}, 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres données.')
      );
    }
  } catch (error) {
    res.status(500).json(createResponse(false, {}, 'Erreur de vérification des privilèges.'));
  }
};

module.exports = {
  auth,
  adminAuth,
  clientAuth,
  ownerAuth,
};
