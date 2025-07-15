const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, adminAuth, ownerAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Obtenir tous les utilisateurs (admin seulement)
// @access  Private (Admin)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
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
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/users/:id
// @desc    Obtenir un utilisateur par ID
// @access  Private (Owner ou Admin)
router.get('/:id', auth, ownerAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-motDePasse');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   PUT /api/users/:id
// @desc    Mettre à jour un utilisateur
// @access  Private (Owner ou Admin)
router.put('/:id', [
  auth,
  ownerAuth,
  body('nom').optional().trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('telephone').optional().isMobilePhone().withMessage('Numéro de téléphone invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { nom, email, telephone } = req.body;
    const updateData = {};
    
    if (nom) updateData.nom = nom;
    if (email) updateData.email = email;
    if (telephone) updateData.telephone = telephone;
    
    // Vérifier si l'email existe déjà (si on le change)
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-motDePasse');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Supprimer un utilisateur
// @access  Private (Admin seulement)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/users/:id/add-favorite
// @desc    Ajouter un plat aux favoris
// @access  Private (Client)
router.post('/:id/add-favorite', [
  auth,
  ownerAuth,
  body('platId').isMongoId().withMessage('ID de plat invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { platId } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Ajouter aux favoris (utilisation de Map pour les préférences)
    const favoris = user.preferences.get('favoris') || [];
    if (!favoris.includes(platId)) {
      favoris.push(platId);
      user.preferences.set('favoris', favoris);
      await user.save();
    }
    
    res.json({
      message: 'Plat ajouté aux favoris',
      favoris
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/users/:id/remove-favorite/:platId
// @desc    Retirer un plat des favoris
// @access  Private (Client)
router.delete('/:id/remove-favorite/:platId', auth, ownerAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Retirer des favoris
    const favoris = user.preferences.get('favoris') || [];
    const newFavoris = favoris.filter(id => id !== req.params.platId);
    user.preferences.set('favoris', newFavoris);
    await user.save();
    
    res.json({
      message: 'Plat retiré des favoris',
      favoris: newFavoris
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des favoris:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/users/:id/favorites
// @desc    Obtenir les favoris d'un utilisateur
// @access  Private (Owner ou Admin)
router.get('/:id/favorites', auth, ownerAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const favoris = user.preferences.get('favoris') || [];
    
    res.json({ favoris });
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;

