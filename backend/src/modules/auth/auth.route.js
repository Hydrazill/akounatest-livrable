const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const Logger = require('../../utils/logger');
const config = require('../../config');
const User = require('../user/user.model');
const { auth } = require('./auth.middleware');
const { createResponse } = require('../../utils/helpers');

const router = express.Router();

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.jwtSecret, {
    expiresIn: config.jwt.jwtExpire
  });
};

// @route   POST /api/auth/register
router.post('/register', [
  body('nom').trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('telephone').isMobilePhone().withMessage('Numéro de téléphone invalide'),
  body('motDePasse').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role').optional().isIn(['client', 'admin']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createResponse(false, { errors: errors.array() }, 'Données invalides')
      );
    }

    const { nom, email, telephone, motDePasse, role = 'client' } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(createResponse(false, {}, 'Un utilisateur avec cet email existe déjà'));
    }

    const user = new User({ nom, email, telephone, motDePasse, role });
    await user.save();

    const token = generateToken(user._id);

    Logger.success('Inscription réussie', {
      userId: user._id,
      email,
      role
    });

    res.status(201).json(
      createResponse(true, {
        token,
        user: {
          id: user._id,
          nom: user.nom,
          email: user.email,
          role: user.role
        }
      }, 'Utilisateur créé avec succès')
    );
  } catch (error) {
    Logger.error('Erreur lors de l\'inscription:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('motDePasse').notEmpty().withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createResponse(false, { errors: errors.array() }, 'Données invalides')
      );
    }

    const { email, motDePasse } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(motDePasse))) {
      return res.status(401).json(createResponse(false, {}, 'Email ou mot de passe incorrect'));
    }

    await user.updateLastAccess();

    const token = generateToken(user._id);

    Logger.success('Connexion réussie', {
      userId: user._id,
      email
    });

    res.json(
      createResponse(true, {
        token,
        user: {
          id: user._id,
          nom: user.nom,
          email: user.email,
          role: user.role
        }
      }, 'Connexion réussie')
    );
  } catch (error) {
    Logger.error('Erreur lors de la connexion:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// @route   GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-motDePasse');

    Logger.success('Récupération du profil réussie', {
      userId: user._id
    });

    res.json(
      createResponse(true, {
        user: {
          id: user._id,
          nom: user.nom,
          email: user.email,
          telephone: user.telephone,
          role: user.role,
          dateCreation: user.dateCreation,
          dernierAcces: user.dernierAcces
        }
      }, 'Informations utilisateur récupérées')
    );
  } catch (error) {
    Logger.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// @route   POST /api/auth/logout
router.post('/logout', auth, async (req, res) => {
  try {
    Logger.success('Déconnexion réussie', { userId: req.user._id });

    res.json(createResponse(true, {}, 'Déconnexion réussie'));
  } catch (error) {
    Logger.error('Erreur lors de la déconnexion:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

module.exports = router;
