const express = require('express');
const { body, validationResult } = require('express-validator');
const Plat = require('../models/Plat');
const Categorie = require('../models/Categorie');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/plats
// @desc    Obtenir tous les plats
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categorieId, 
      disponible, 
      search,
      restaurantId = 'akounamatata_main'
    } = req.query;
    
    const query = { restaurantId };
    
    if (categorieId) {
      query.categorieId = categorieId;
    }
    
    if (disponible !== undefined) {
      query.disponible = disponible === 'true';
    }
    
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ingredients: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const plats = await Plat.find(query)
      .populate('categorieId', 'nom')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ nom: 1 });
    
    const total = await Plat.countDocuments(query);
    
    res.json({
      plats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des plats:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/plats/featured
// @desc    Obtenir les plats en vedette
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6, restaurantId = 'akounamatata_main' } = req.query;
    
    // Pour l'instant, on retourne les plats les plus récents et disponibles
    const plats = await Plat.find({ 
      disponible: true,
      restaurantId 
    })
      .populate('categorieId', 'nom')
      .sort({ createdAt: -1 })
      .limit(limit * 1);
    
    res.json({ plats });
  } catch (error) {
    console.error('Erreur lors de la récupération des plats en vedette:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/plats/:id
// @desc    Obtenir un plat par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const plat = await Plat.findById(req.params.id)
      .populate('categorieId', 'nom description');
    
    if (!plat) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }
    
    res.json({ plat });
  } catch (error) {
    console.error('Erreur lors de la récupération du plat:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/plats
// @desc    Créer un nouveau plat
// @access  Private (Admin)
router.post('/', [
  auth,
  adminAuth,
  body('nom').trim().notEmpty().withMessage('Le nom du plat est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('prix').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('categorieId').isMongoId().withMessage('ID de catégorie invalide'),
  body('ingredients').optional().isArray().withMessage('Les ingrédients doivent être un tableau'),
  body('allergenes').optional().isArray().withMessage('Les allergènes doivent être un tableau'),
  body('tempsPreparation').optional().isInt({ min: 0 }).withMessage('Le temps de préparation doit être positif'),
  body('imageUrl').optional().isURL().withMessage('URL d\'image invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      nom,
      description,
      prix,
      devise = 'FCFA',
      imageUrl,
      categorieId,
      ingredients = [],
      allergenes = [],
      tempsPreparation = 0,
      disponible = true,
      anecdotesCourtes = [],
      anecdotesCompletes = [],
      restaurantId = 'akounamatata_main'
    } = req.body;
    
    // Vérifier que la catégorie existe
    const categorie = await Categorie.findById(categorieId);
    if (!categorie) {
      return res.status(400).json({ message: 'Catégorie non trouvée' });
    }
    
    const plat = new Plat({
      nom,
      description,
      prix,
      devise,
      imageUrl,
      categorieId,
      ingredients,
      allergenes,
      tempsPreparation,
      disponible,
      anecdotesCourtes,
      anecdotesCompletes,
      restaurantId
    });
    
    await plat.save();
    await plat.populate('categorieId', 'nom');
    
    res.status(201).json({
      message: 'Plat créé avec succès',
      plat
    });
  } catch (error) {
    console.error('Erreur lors de la création du plat:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   PUT /api/plats/:id
// @desc    Mettre à jour un plat
// @access  Private (Admin)
router.put('/:id', [
  auth,
  adminAuth,
  body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('description').optional().trim().notEmpty().withMessage('La description ne peut pas être vide'),
  body('prix').optional().isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('categorieId').optional().isMongoId().withMessage('ID de catégorie invalide'),
  body('ingredients').optional().isArray().withMessage('Les ingrédients doivent être un tableau'),
  body('allergenes').optional().isArray().withMessage('Les allergènes doivent être un tableau'),
  body('tempsPreparation').optional().isInt({ min: 0 }).withMessage('Le temps de préparation doit être positif'),
  body('imageUrl').optional().isURL().withMessage('URL d\'image invalide'),
  body('disponible').optional().isBoolean().withMessage('Disponible doit être un booléen')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const updateData = { ...req.body };
    
    // Vérifier que la catégorie existe si elle est fournie
    if (updateData.categorieId) {
      const categorie = await Categorie.findById(updateData.categorieId);
      if (!categorie) {
        return res.status(400).json({ message: 'Catégorie non trouvée' });
      }
    }
    
    const plat = await Plat.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categorieId', 'nom');
    
    if (!plat) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }
    
    res.json({
      message: 'Plat mis à jour avec succès',
      plat
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du plat:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/plats/:id
// @desc    Supprimer un plat
// @access  Private (Admin)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const plat = await Plat.findByIdAndDelete(req.params.id);
    
    if (!plat) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }
    
    res.json({ message: 'Plat supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du plat:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   PATCH /api/plats/:id/toggle-availability
// @desc    Basculer la disponibilité d'un plat
// @access  Private (Admin)
router.patch('/:id/toggle-availability', auth, adminAuth, async (req, res) => {
  try {
    const plat = await Plat.findById(req.params.id);
    
    if (!plat) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }
    
    plat.disponible = !plat.disponible;
    await plat.save();
    await plat.populate('categorieId', 'nom');
    
    res.json({
      message: `Plat ${plat.disponible ? 'activé' : 'désactivé'} avec succès`,
      plat
    });
  } catch (error) {
    console.error('Erreur lors du changement de disponibilité:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/plats/:id/nutrition
// @desc    Obtenir les informations nutritionnelles d'un plat
// @access  Public
router.get('/:id/nutrition', async (req, res) => {
  try {
    const plat = await Plat.findById(req.params.id)
      .select('nom valeurNutritionnelle allergenes');
    
    if (!plat) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }
    
    res.json({
      nom: plat.nom,
      valeurNutritionnelle: plat.valeurNutritionnelle,
      allergenes: plat.allergenes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations nutritionnelles:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;

