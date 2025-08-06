
const express = require('express');
const { body, validationResult } = require('express-validator');

const MenuDuJour = require('./menuDuJour.model');
const Plat = require('../plat/plat.model');
const { auth, adminAuth, ownerAuth } = require('../auth/auth.middleware');
const Logger = require('../../utils/logger');
const { createResponse } = require('../../utils/helpers');

const router = express.Router();

// GET /api/menus
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, actif, date, restaurantId = 'akounamatata_main' } = req.query;
    const query = { restaurantId };
    if (actif !== undefined) query.statutActif = actif === 'true';
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate()+1);
      query.date = { $gte: start, $lt: end };
    }

    const menus = await MenuDuJour.find(query)
      .populate('plats', 'nom prix imageUrl disponible')
      .limit(limit)
      .skip((page-1)*limit)
      .sort({ date: -1 });
    const total = await MenuDuJour.countDocuments(query);

    Logger.success('Menus récupérés', { total, page });
    res.json(createResponse(true, { menus, totalPages: Math.ceil(total/limit), currentPage: +page, total }, 'Menus récupérés'));
  } catch (err) {
    Logger.error('Erreur récupération menus', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/menus/today
router.get('/today', async (req, res) => {
  try {
    const { restaurantId = 'akounamatata_main' } = req.query;
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    const menu = await MenuDuJour.findOne({ restaurantId, statutActif: true, date: { $gte: today, $lt: tomorrow } })
      .populate('plats', 'nom description prix imageUrl disponible categorieId ingredients allergenes')
      .populate({ path: 'plats', populate: { path: 'categorieId', select: 'nom' } });

    if (!menu) return res.status(404).json(createResponse(false, {}, 'Aucun menu du jour actif'));

    Logger.success('Menu du jour récupéré', { id: menu._id });
    res.json(createResponse(true, { menu }, 'Menu du jour récupéré'));
  } catch (err) {
    Logger.error('Erreur récupération menu today', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/menus/:id
router.get('/:id', async (req, res) => {
  try {
    const menu = await MenuDuJour.findById(req.params.id)
      .populate('plats', 'nom description prix imageUrl disponible categorieId ingredients allergenes')
      .populate({ path: 'plats', populate: { path: 'categorieId', select: 'nom' } });

    if (!menu) return res.status(404).json(createResponse(false, {}, 'Menu non trouvé'));

    Logger.success('Menu récupéré', { id: menu._id });
    res.json(createResponse(true, { menu }, 'Menu récupéré'));
  } catch (err) {
    Logger.error('Erreur récupération menu', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// POST /api/menus
router.post('/', auth, adminAuth, [
  body('titre').trim().notEmpty().withMessage('Titre requis'),
  body('plats').isArray().withMessage('Plats doit être un tableau'),
  body('plats.*').isMongoId().withMessage('ID de plat invalide'),
  body('description').optional().trim(),
  body('date').optional().isISO8601().withMessage('Date invalide'),
  body('statutActif').optional().isBoolean(),
  body('versionWeb').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));
    }

    const { titre, description, date = new Date(), plats = [], statutActif = true, versionWeb = true, restaurantId = 'akounamatata_main' } = req.body;
    const existing = await Plat.find({ _id: { $in: plats } });
    if (existing.length !== plats.length) {
      return res.status(400).json(createResponse(false, {}, 'Un ou plusieurs plats n\'existent pas'));
    }

    const menu = new MenuDuJour({ titre, description, date: new Date(date), plats, statutActif, versionWeb, restaurantId });
    await menu.save();
    await menu.populate('plats', 'nom prix imageUrl disponible');

    Logger.success('Menu créé', { id: menu._id });
    res.status(201).json(createResponse(true, { menu }, 'Menu créé avec succès'));
  } catch (err) {
    Logger.error('Erreur création menu', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// PUT /api/menus/:id
router.put('/:id', auth, adminAuth, [
  body('titre').optional().trim().notEmpty().withMessage('Titre requis si fourni'),
  body('plats').optional().isArray(),
  body('plats.*').optional().isMongoId(),
  body('date').optional().isISO8601(),
  body('statutActif').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));

    const update = { ...req.body };
    if (update.plats) {
      const existing = await Plat.find({ _id: { $in: update.plats } });
      if (existing.length !== update.plats.length) {
        return res.status(400).json(createResponse(false, {}, 'Un ou plusieurs plats n\'existent pas'));
      }
    }
    if (update.date) update.date = new Date(update.date);

    const menu = await MenuDuJour.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('plats', 'nom prix imageUrl disponible');
    if (!menu) return res.status(404).json(createResponse(false, {}, 'Menu non trouvé'));

    Logger.success('Menu mis à jour', { id: menu._id });
    res.json(createResponse(true, { menu }, 'Menu mis à jour avec succès'));
  } catch (err) {
    Logger.error('Erreur mise à jour menu', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// DELETE /api/menus/:id
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const menu = await MenuDuJour.findByIdAndDelete(req.params.id);
    if (!menu) return res.status(404).json(createResponse(false, {}, 'Menu non trouvé'));

    Logger.success('Menu supprimé', { id: req.params.id });
    res.json(createResponse(true, {}, 'Menu supprimé'));
  } catch (err) {
    Logger.error('Erreur suppression menu', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// PATCH /api/menus/:id/toggle-status
router.patch('/:id/toggle-status', auth, adminAuth, async (req, res) => {
  try {
    const menu = await MenuDuJour.findById(req.params.id);
    if (!menu) return res.status(404).json(createResponse(false, {}, 'Menu non trouvé'));

    menu.statutActif = !menu.statutActif;
    await menu.save();
    await menu.populate('plats', 'nom prix imageUrl disponible');

    Logger.success('Statut menu basculé', { id: menu._id, actif: menu.statutActif });
    res.json(createResponse(true, { menu }, `Menu ${menu.statutActif ? 'activé' : 'désactivé'}`));
  } catch (err) {
    Logger.error('Erreur bascule statut menu', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// POST /api/menus/:id/add-plat
router.post('/:id/add-plat', auth, adminAuth, [
  body('platId').isMongoId().withMessage('ID de plat invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));

    const { platId } = req.body;
    const plat = await Plat.findById(platId);
    if (!plat) return res.status(400).json(createResponse(false, {}, 'Plat non trouvé'));

    const menu = await MenuDuJour.findById(req.params.id);
    if (!menu) return res.status(404).json(createResponse(false, {}, 'Menu non trouvé'));

    if (!menu.plats.includes(platId)) {
      menu.plats.push(platId);
      await menu.save();
    }
    await menu.populate('plats', 'nom prix imageUrl disponible');

    Logger.success('Plat ajouté au menu', { menuId: menu._id, platId });
    res.json(createResponse(true, { menu }, 'Plat ajouté au menu'));
  } catch (err) {
    Logger.error('Erreur ajout plat au menu', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// DELETE /api/menus/:id/remove-plat/:platId
router.delete('/:id/remove-plat/:platId', auth, adminAuth, async (req, res) => {
  try {
    const menu = await MenuDuJour.findById(req.params.id);
    if (!menu) return res.status(404).json(createResponse(false, {}, 'Menu non trouvé'));

    menu.plats = menu.plats.filter(id => id.toString() !== req.params.platId);
    await menu.save();
    await menu.populate('plats', 'nom prix imageUrl disponible');

    Logger.success('Plat retiré du menu', { menuId: menu._id, platRemoved: req.params.platId });
    res.json(createResponse(true, { menu }, 'Plat retiré du menu'));
  } catch (err) {
    Logger.error('Erreur suppression plat du menu', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

module.exports = router;
