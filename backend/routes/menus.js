const express = require('express');
const { body, validationResult } = require('express-validator');
const MenuDuJour = require('../models/MenuDuJour');
const Plat = require('../models/Plat');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/menus
// @desc    Obtenir tous les menus du jour
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      actif, 
      date,
      restaurantId = 'akounamatata_main'
    } = req.query;
    
    const query = { restaurantId };
    
    if (actif !== undefined) {
      query.statutActif = actif === 'true';
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    const menus = await MenuDuJour.find(query)
      .populate('plats', 'nom prix imageUrl disponible')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });
    
    const total = await MenuDuJour.countDocuments(query);
    
    res.json({
      menus,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des menus:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/menus/today
// @desc    Obtenir le menu du jour actuel
// @access  Public
router.get('/today', async (req, res) => {
  try {
    const { restaurantId = 'akounamatata_main' } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const menu = await MenuDuJour.findOne({
      restaurantId,
      statutActif: true,
      date: { $gte: today, $lt: tomorrow }
    })
      .populate('plats', 'nom description prix imageUrl disponible categorieId ingredients allergenes')
      .populate({
        path: 'plats',
        populate: {
          path: 'categorieId',
          select: 'nom'
        }
      });
    
    if (!menu) {
      return res.status(404).json({ message: 'Aucun menu du jour actif trouvé' });
    }
    
    res.json({ menu });
  } catch (error) {
    console.error('Erreur lors de la récupération du menu du jour:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/menus/:id
// @desc    Obtenir un menu du jour par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const menu = await MenuDuJour.findById(req.params.id)
      .populate('plats', 'nom description prix imageUrl disponible categorieId ingredients allergenes')
      .populate({
        path: 'plats',
        populate: {
          path: 'categorieId',
          select: 'nom'
        }
      });
    
    if (!menu) {
      return res.status(404).json({ message: 'Menu non trouvé' });
    }
    
    res.json({ menu });
  } catch (error) {
    console.error('Erreur lors de la récupération du menu:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/menus
// @desc    Créer un nouveau menu du jour
// @access  Private (Admin)
router.post('/', [
  auth,
  adminAuth,
  body('titre').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').optional().trim(),
  body('date').optional().isISO8601().withMessage('Date invalide'),
  body('plats').isArray().withMessage('Les plats doivent être un tableau'),
  body('plats.*').isMongoId().withMessage('ID de plat invalide')
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
      titre,
      description,
      date = new Date(),
      plats = [],
      statutActif = true,
      versionWeb = true,
      restaurantId = 'akounamatata_main'
    } = req.body;
    
    // Vérifier que tous les plats existent
    const existingPlats = await Plat.find({ _id: { $in: plats } });
    if (existingPlats.length !== plats.length) {
      return res.status(400).json({ message: 'Un ou plusieurs plats n\'existent pas' });
    }
    
    const menu = new MenuDuJour({
      titre,
      description,
      date: new Date(date),
      plats,
      statutActif,
      versionWeb,
      restaurantId
    });
    
    await menu.save();
    await menu.populate('plats', 'nom prix imageUrl disponible');
    
    res.status(201).json({
      message: 'Menu du jour créé avec succès',
      menu
    });
  } catch (error) {
    console.error('Erreur lors de la création du menu:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   PUT /api/menus/:id
// @desc    Mettre à jour un menu du jour
// @access  Private (Admin)
router.put('/:id', [
  auth,
  adminAuth,
  body('titre').optional().trim().notEmpty().withMessage('Le titre ne peut pas être vide'),
  body('description').optional().trim(),
  body('date').optional().isISO8601().withMessage('Date invalide'),
  body('plats').optional().isArray().withMessage('Les plats doivent être un tableau'),
  body('plats.*').optional().isMongoId().withMessage('ID de plat invalide'),
  body('statutActif').optional().isBoolean().withMessage('Statut actif doit être un booléen')
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
    
    // Vérifier que tous les plats existent si fournis
    if (updateData.plats) {
      const existingPlats = await Plat.find({ _id: { $in: updateData.plats } });
      if (existingPlats.length !== updateData.plats.length) {
        return res.status(400).json({ message: 'Un ou plusieurs plats n\'existent pas' });
      }
    }
    
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    
    const menu = await MenuDuJour.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('plats', 'nom prix imageUrl disponible');
    
    if (!menu) {
      return res.status(404).json({ message: 'Menu non trouvé' });
    }
    
    res.json({
      message: 'Menu du jour mis à jour avec succès',
      menu
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du menu:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/menus/:id
// @desc    Supprimer un menu du jour
// @access  Private (Admin)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const menu = await MenuDuJour.findByIdAndDelete(req.params.id);
    
    if (!menu) {
      return res.status(404).json({ message: 'Menu non trouvé' });
    }
    
    res.json({ message: 'Menu du jour supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du menu:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   PATCH /api/menus/:id/toggle-status
// @desc    Basculer le statut actif d'un menu
// @access  Private (Admin)
router.patch('/:id/toggle-status', auth, adminAuth, async (req, res) => {
  try {
    const menu = await MenuDuJour.findById(req.params.id);
    
    if (!menu) {
      return res.status(404).json({ message: 'Menu non trouvé' });
    }
    
    menu.statutActif = !menu.statutActif;
    await menu.save();
    await menu.populate('plats', 'nom prix imageUrl disponible');
    
    res.json({
      message: `Menu ${menu.statutActif ? 'activé' : 'désactivé'} avec succès`,
      menu
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/menus/:id/add-plat
// @desc    Ajouter un plat à un menu
// @access  Private (Admin)
router.post('/:id/add-plat', [
  auth,
  adminAuth,
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
    
    // Vérifier que le plat existe
    const plat = await Plat.findById(platId);
    if (!plat) {
      return res.status(400).json({ message: 'Plat non trouvé' });
    }
    
    const menu = await MenuDuJour.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu non trouvé' });
    }
    
    // Ajouter le plat s'il n'est pas déjà dans le menu
    if (!menu.plats.includes(platId)) {
      menu.plats.push(platId);
      await menu.save();
    }
    
    await menu.populate('plats', 'nom prix imageUrl disponible');
    
    res.json({
      message: 'Plat ajouté au menu avec succès',
      menu
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du plat au menu:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/menus/:id/remove-plat/:platId
// @desc    Retirer un plat d'un menu
// @access  Private (Admin)
router.delete('/:id/remove-plat/:platId', auth, adminAuth, async (req, res) => {
  try {
    const menu = await MenuDuJour.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu non trouvé' });
    }
    
    // Retirer le plat du menu
    menu.plats = menu.plats.filter(platId => platId.toString() !== req.params.platId);
    await menu.save();
    await menu.populate('plats', 'nom prix imageUrl disponible');
    
    res.json({
      message: 'Plat retiré du menu avec succès',
      menu
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du plat du menu:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;

