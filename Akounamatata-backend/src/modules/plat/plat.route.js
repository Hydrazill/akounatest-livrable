
const express = require('express');
const { body, validationResult } = require('express-validator');

const Plat = require('./plat.model');
const Categorie = require('../categorie/categorie.model');
const { auth, adminAuth, ownerAuth } = require('../auth/auth.middleware');
const Logger = require('../../utils/logger');
const { createResponse } = require('../../utils/helpers');

const router = express.Router();

// GET /api/plats
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, categorieId, disponible, search, restaurantId = 'akounamatata_main' } = req.query;
    const query = { restaurantId };
    if (categorieId) query.categorieId = categorieId;
    if (disponible !== undefined) query.disponible = disponible === 'true';
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

    Logger.success('Plats récupérés', { page: +page, limit: +limit, total });
    res.json(createResponse(true, { plats, totalPages: Math.ceil(total / limit), currentPage: +page, total }, 'Plats récupérés'));
  } catch (err) {
    Logger.error('Erreur récupération plats', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/plats/featured
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6, restaurantId = 'akounamatata_main' } = req.query;
    const plats = await Plat.find({ disponible: true, restaurantId })
      .populate('categorieId', 'nom')
      .sort({ createdAt: -1 })
      .limit(limit * 1);

    Logger.success('Plats en vedette récupérés', { limit });
    res.json(createResponse(true, { plats }, 'Plats en vedette récupérés'));
  } catch (err) {
    Logger.error('Erreur récupération plats en vedette', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/plats/:id
router.get('/:id', async (req, res) => {
  try {
    const plat = await Plat.findById(req.params.id).populate('categorieId', 'nom description');
    if (!plat) {
      Logger.error('Plat non trouvé', { platId: req.params.id });
      return res.status(404).json(createResponse(false, {}, 'Plat non trouvé'));
    }
    Logger.success('Plat récupéré', { platId: plat._id });
    res.json(createResponse(true, { plat }, 'Plat récupéré'));
  } catch (err) {
    Logger.error('Erreur récupération plat', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// POST /api/plats
router.post('/', auth, adminAuth, [
  body('nom').trim().notEmpty().withMessage('Nom requis'),
  body('description').trim().notEmpty().withMessage('Description requise'),
  body('prix').isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('categorieId').isMongoId().withMessage('Catégorie invalide'),
  body('imageUrl').optional().isURL().withMessage('URL invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Logger.error('Validation création plat', { errors: errors.array() });
      return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));
    }

    const data = req.body;
    const cat = await Categorie.findById(data.categorieId);
    if (!cat) {
      Logger.error('Catégorie non trouvée', { categorieId: data.categorieId });
      return res.status(400).json(createResponse(false, {}, 'Catégorie non trouvée'));
    }

    const plat = new Plat(data);
    await plat.save();
    await plat.populate('categorieId', 'nom');

    Logger.success('Plat créé', { platId: plat._id, nom: plat.nom });
    res.status(201).json(createResponse(true, { plat }, 'Plat créé'));
  } catch (err) {
    Logger.error('Erreur création plat', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// PUT /api/plats/:id
router.put('/:id', auth, adminAuth, [
  body('prix').optional().isFloat({ min: 0 }),
  body('categorieId').optional().isMongoId(),
  body('imageUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));

    const data = req.body;
    if (data.categorieId) {
      const cat = await Categorie.findById(data.categorieId);
      if (!cat) return res.status(400).json(createResponse(false, {}, 'Catégorie non trouvée'));
    }

    const plat = await Plat.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).populate('categorieId', 'nom');
    if (!plat) {
      Logger.error('Plat non trouvé', { platId: req.params.id });
      return res.status(404).json(createResponse(false, {}, 'Plat non trouvé'));
    }

    Logger.success('Plat mis à jour', { platId: plat._id });
    res.json(createResponse(true, { plat }, 'Plat mis à jour'));
  } catch (err) {
    Logger.error('Erreur mise à jour plat', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// DELETE /api/plats/:id
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const plat = await Plat.findByIdAndDelete(req.params.id);
    if (!plat) return res.status(404).json(createResponse(false, {}, 'Plat non trouvé'));

    Logger.success('Plat supprimé', { platId: req.params.id });
    res.json(createResponse(true, {}, 'Plat supprimé'));
  } catch (err) {
    Logger.error('Erreur suppression plat', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// PATCH /api/plats/:id/toggle-availability
router.patch('/:id/toggle-availability', auth, adminAuth, async (req, res) => {
  try {
    const plat = await Plat.findById(req.params.id);
    if (!plat) return res.status(404).json(createResponse(false, {}, 'Plat non trouvé'));

    plat.disponible = !plat.disponible;
    await plat.save();
    await plat.populate('categorieId', 'nom');

    Logger.success('Disponibilité modifiée', { platId: plat._id, disponible: plat.disponible });
    res.json(createResponse(true, { plat }, `Plat ${plat.disponible ? 'activé' : 'désactivé'}`));
  } catch (err) {
    Logger.error('Erreur toggle disponibilité plat', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/plats/:id/nutrition
router.get('/:id/nutrition', async (req, res) => {
  try {
    const plat = await Plat.findById(req.params.id).select('nom valeurNutritionnelle allergenes');
    if (!plat) return res.status(404).json(createResponse(false, {}, 'Plat non trouvé'));

    Logger.success('Infos nutritionnelles récupérées', { platId: plat._id });
    res.json(createResponse(true, { nom: plat.nom, valeurNutritionnelle: plat.valeurNutritionnelle, allergenes: plat.allergenes }, 'Données nutritionnelles'));
  } catch (err) {
    Logger.error('Erreur récupération info nutrition', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

module.exports = router;
