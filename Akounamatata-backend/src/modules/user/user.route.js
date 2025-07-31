const express = require('express');
const { body, validationResult } = require('express-validator');

const Logger = require('../../utils/logger');
const User = require('./user.model');
const { auth, adminAuth, ownerAuth } = require('../auth/auth.middleware');
const { createResponse } = require('../../utils/helpers');

const router = express.Router();

// GET /api/users
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-motDePasse')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dateCreation: -1 });

    const total = await User.countDocuments(query);

    Logger.success('Liste des utilisateurs récupérée avec succès', { total });

    res.json(createResponse(true, {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    }, 'Liste des utilisateurs récupérée avec succès'));
  } catch (error) {
    Logger.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/users/:id
router.get('/:id', auth, ownerAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-motDePasse');
    if (!user) {
      return res.status(404).json(createResponse(false, {}, 'Utilisateur non trouvé'));
    }

    Logger.success('Utilisateur récupéré avec succès', { userId: user._id });

    res.json(createResponse(true, { user }, 'Utilisateur récupéré avec succès'));
  } catch (error) {
    Logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// PUT /api/users/:id
router.put('/:id', [
  auth,
  ownerAuth,
  body('nom').optional().trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('telephone').optional().isMobilePhone().withMessage('Numéro de téléphone invalide'),
  body('role').optional().isIn(['client', 'admin', 'gestionnaire']).withMessage('Role invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));
    }

    const { nom, email, telephone, role } = req.body;
    const updateData = {};
    if (nom) updateData.nom = nom;
    if (email) updateData.email = email;
    if (telephone) updateData.telephone = telephone;
    if (role) updateData.role = role;

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json(createResponse(false, {}, 'Un utilisateur avec cet email existe déjà'));
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-motDePasse');

    if (!user) {
      return res.status(404).json(createResponse(false, {}, 'Utilisateur non trouvé'));
    }

    Logger.success('Utilisateur mis à jour avec succès', { userId: user._id });

    res.json(createResponse(true, { user }, 'Utilisateur mis à jour avec succès'));
  } catch (error) {
    Logger.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// DELETE /api/users/:id
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json(createResponse(false, {}, 'Utilisateur non trouvé'));
    }

    Logger.success('Utilisateur supprimé avec succès', { userId: req.params.id });

    res.json(createResponse(true, {}, 'Utilisateur supprimé avec succès'));
  } catch (error) {
    Logger.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// POST /api/users/:id/add-favorite
router.post('/:id/add-favorite', [
  auth,
  ownerAuth,
  body('platId').isMongoId().withMessage('ID de plat invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));
    }

    const { platId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json(createResponse(false, {}, 'Utilisateur non trouvé'));
    }

    const favoris = user.preferences.get('favoris') || [];
    if (!favoris.includes(platId)) {
      favoris.push(platId);
      user.preferences.set('favoris', favoris);
      // await user.save();
      const userU = await User.findByIdAndUpdate(
        user._id,
        user,
        { new: true, runValidators: true }
      ).select('-motDePasse');
    }

    Logger.success('Plat ajouté aux favoris', { userId: user._id, platId });

    res.json(createResponse(true, { favoris }, 'Plat ajouté aux favoris'));
  } catch (error) {
    Logger.error('Erreur lors de l\'ajout aux favoris:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// DELETE /api/users/:id/remove-favorite/:platId
router.delete('/:id/remove-favorite/:platId', auth, ownerAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json(createResponse(false, {}, 'Utilisateur non trouvé'));
    }

    const favoris = user.preferences.get('favoris') || [];
    const newFavoris = favoris.filter(id => id !== req.params.platId);
    user.preferences.set('favoris', newFavoris);
    await user.save();

    Logger.success('Plat retiré des favoris', { userId: user._id, platId: req.params.platId });

    res.json(createResponse(true, { favoris: newFavoris }, 'Plat retiré des favoris'));
  } catch (error) {
    Logger.error('Erreur lors de la suppression des favoris:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/users/:id/favorites
router.get('/:id/favorites', auth, ownerAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json(createResponse(false, {}, 'Utilisateur non trouvé'));
    }

    const favoris = user.preferences.get('favoris') || [];

    Logger.success('Favoris récupérés avec succès', { userId: user._id, total: favoris.length });

    res.json(createResponse(true, { favoris }, 'Favoris récupérés avec succès'));
  } catch (error) {
    Logger.error('Erreur lors de la récupération des favoris:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

module.exports = router;
