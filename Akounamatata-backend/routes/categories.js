const express = require('express');
const { body, validationResult } = require('express-validator');
const Categorie = require('../models/Categorie');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Obtenir toutes les catégories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { restaurantId = 'akounamatata_main' } = req.query;
    
    const categories = await Categorie.find({ restaurantId })
      .sort({ ordre: 1, nom: 1 });
    
    res.json({ categories });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/categories/:id
// @desc    Obtenir une catégorie par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id);
    
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    res.json({ categorie });
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/categories
// @desc    Créer une nouvelle catégorie
// @access  Private (Admin)
router.post('/', [
  auth,
  adminAuth,
  body('nom').trim().notEmpty().withMessage('Le nom de la catégorie est requis'),
  body('description').optional().trim(),
  body('ordre').optional().isInt({ min: 0 }).withMessage('L\'ordre doit être un nombre positif'),
  body('iconUrl').optional().isURL().withMessage('URL d\'icône invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { nom, description, ordre = 0, iconUrl, restaurantId = 'akounamatata_main' } = req.body;
    
    // Vérifier si la catégorie existe déjà
    const existingCategorie = await Categorie.findOne({ nom, restaurantId });
    if (existingCategorie) {
      return res.status(400).json({ message: 'Une catégorie avec ce nom existe déjà' });
    }
    
    const categorie = new Categorie({
      nom,
      description,
      ordre,
      iconUrl,
      restaurantId
    });
    
    await categorie.save();
    
    res.status(201).json({
      message: 'Catégorie créée avec succès',
      categorie
    });
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Mettre à jour une catégorie
// @access  Private (Admin)
router.put('/:id', [
  auth,
  adminAuth,
  body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('description').optional().trim(),
  body('ordre').optional().isInt({ min: 0 }).withMessage('L\'ordre doit être un nombre positif'),
  body('iconUrl').optional().isURL().withMessage('URL d\'icône invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { nom, description, ordre, iconUrl } = req.body;
    const updateData = {};
    
    if (nom) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (ordre !== undefined) updateData.ordre = ordre;
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
    
    // Vérifier si le nouveau nom existe déjà
    if (nom) {
      const existingCategorie = await Categorie.findOne({ 
        nom, 
        _id: { $ne: req.params.id },
        restaurantId: updateData.restaurantId || 'akounamatata_main'
      });
      if (existingCategorie) {
        return res.status(400).json({ message: 'Une catégorie avec ce nom existe déjà' });
      }
    }
    
    const categorie = await Categorie.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    res.json({
      message: 'Catégorie mise à jour avec succès',
      categorie
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Supprimer une catégorie
// @access  Private (Admin)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    // Vérifier s'il y a des plats dans cette catégorie
    const Plat = require('../models/Plat');
    const platsCount = await Plat.countDocuments({ categorieId: req.params.id });
    
    if (platsCount > 0) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer une catégorie qui contient des plats' 
      });
    }
    
    const categorie = await Categorie.findByIdAndDelete(req.params.id);
    
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/categories/:id/plats
// @desc    Obtenir tous les plats d'une catégorie
// @access  Public
router.get('/:id/plats', async (req, res) => {
  try {
    const Plat = require('../models/Plat');
    const { disponible } = req.query;
    
    const query = { categorieId: req.params.id };
    if (disponible !== undefined) {
      query.disponible = disponible === 'true';
    }
    
    const plats = await Plat.find(query)
      .populate('categorieId', 'nom')
      .sort({ nom: 1 });
    
    res.json({ plats });
  } catch (error) {
    console.error('Erreur lors de la récupération des plats de la catégorie:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;

