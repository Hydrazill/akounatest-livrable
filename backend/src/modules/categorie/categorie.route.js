
const express = require('express');
const { body, validationResult } = require('express-validator');

const Categorie = require('./categorie.model');
const { auth, adminAuth } = require('../auth/auth.middleware');
const Logger = require('../../utils/logger');
const { createResponse } = require('../../utils/helpers');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const { restaurantId = 'akounamatata_main' } = req.query;

    const categories = await Categorie.find({ restaurantId }).sort({ ordre: 1, nom: 1 });

    Logger.success('Liste des catégories récupérée', { count: categories.length });
    res.json(createResponse(true, { categories }, 'Liste des catégories récupérée'));
  } catch (error) {
    Logger.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id);

    if (!categorie) {
      return res.status(404).json(createResponse(false, {}, 'Catégorie non trouvée'));
    }

    Logger.success('Catégorie récupérée', { id: req.params.id });
    res.json(createResponse(true, { categorie }, 'Catégorie récupérée'));
  } catch (error) {
    Logger.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// POST /api/categories
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
      return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));
    }

    const { nom, description, ordre = 0, iconUrl, restaurantId = 'akounamatata_main' } = req.body;

    const existingCategorie = await Categorie.findOne({ nom, restaurantId });
    if (existingCategorie) {
      return res.status(400).json(createResponse(false, {}, 'Une catégorie avec ce nom existe déjà'));
    }

    const categorie = new Categorie({
      nom,
      description,
      ordre,
      iconUrl,
      restaurantId
    });

    await categorie.save();

    Logger.success('Catégorie créée avec succès', { id: categorie._id });
    res.status(201).json(createResponse(true, { categorie }, 'Catégorie créée avec succès'));
  } catch (error) {
    Logger.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// PUT /api/categories/:id
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
      return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));
    }

    const { nom, description, ordre, iconUrl } = req.body;
    const updateData = {};

    if (nom) updateData.nom = nom;
    if (description !== undefined) updateData.description = description;
    if (ordre !== undefined) updateData.ordre = ordre;
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;

    if (nom) {
      const existingCategorie = await Categorie.findOne({
        nom,
        _id: { $ne: req.params.id },
        restaurantId: updateData.restaurantId || 'akounamatata_main'
      });
      if (existingCategorie) {
        return res.status(400).json(createResponse(false, {}, 'Une catégorie avec ce nom existe déjà'));
      }
    }

    const categorie = await Categorie.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!categorie) {
      return res.status(404).json(createResponse(false, {}, 'Catégorie non trouvée'));
    }

    Logger.success('Catégorie mise à jour', { id: categorie._id });
    res.json(createResponse(true, { categorie }, 'Catégorie mise à jour avec succès'));
  } catch (error) {
    Logger.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// DELETE /api/categories/:id
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const Plat = require('../plat/plat.model');
    const platsCount = await Plat.countDocuments({ categorieId: req.params.id });

    if (platsCount > 0) {
      return res.status(400).json(createResponse(false, {}, 'Impossible de supprimer une catégorie qui contient des plats'));
    }

    const categorie = await Categorie.findByIdAndDelete(req.params.id);

    if (!categorie) {
      return res.status(404).json(createResponse(false, {}, 'Catégorie non trouvée'));
    }

    Logger.success('Catégorie supprimée', { id: req.params.id });
    res.json(createResponse(true, {}, 'Catégorie supprimée avec succès'));
  } catch (error) {
    Logger.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/categories/:id/plats
router.get('/:id/plats', async (req, res) => {
  try {
    const Plat = require('../plat/plat.model');
    const { disponible } = req.query;

    const query = { categorieId: req.params.id };
    if (disponible !== undefined) {
      query.disponible = disponible === 'true';
    }

    const plats = await Plat.find(query)
      .populate('categorieId', 'nom')
      .sort({ nom: 1 });

    Logger.success('Plats de la catégorie récupérés', {
      categorieId: req.params.id,
      count: plats.length
    });

    res.json(createResponse(true, { plats }, 'Plats de la catégorie récupérés'));
  } catch (error) {
    Logger.error('Erreur lors de la récupération des plats de la catégorie:', error);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

module.exports = router;
