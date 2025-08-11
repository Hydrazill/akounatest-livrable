
const express = require('express');
const { body, validationResult } = require('express-validator');

const Panier = require('./panier.model');
const Plat = require('../plat/plat.model');
const Table = require('../table/table.model');
const { validateTableQRCode } = require('../../utils/qrcode');
const { auth, adminAuth, ownerAuth } = require('../auth/auth.middleware');
const Logger = require('../../utils/logger');
const { createResponse } = require('../../utils/helpers');

const router = express.Router();

// GET panier
router.get('/:clientId', async (req, res) => {
  try {
    let params = { clientId: req.params.clientId, actif: true };
    if(req.query.tableId) {
      params = { params, ...{ tableId: req.query.tableId } };
    }
    console.log("params: ", params)
    const panier = await Panier.findOne(params)
      .populate('items.platId', 'nom prix imageUrl disponible')
      .populate('tableId', 'numero')
      .populate('clientId', 'nom email');
    if (!panier) return res.status(404).json(createResponse(false, {}, 'Panier non trouvé'));

    Logger.success('Panier récupéré', { clientId: req.params.clientId, panierId: panier._id });
    res.json(createResponse(true, { panier }, 'Panier récupéré'));
  } catch (err) {
    Logger.error('Erreur récupération panier', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// POST ajouter article
router.post('/:clientId/add', [
  body('platId').isMongoId().withMessage('ID de plat invalide'),
  body('quantite').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('tableId').isMongoId().withMessage('ID de table invalide'),
  body('commentaires').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));

    const { platId, quantite, tableId, commentaires = '' } = req.body;
    const clientId = req.params.clientId;

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json(createResponse(false, {}, 'Table non trouvée'));

    const plat = await Plat.findById(platId);
    if (!plat) return res.status(404).json(createResponse(false, {}, 'Plat non trouvé'));
    if (!plat.disponible) return res.status(400).json(createResponse(false, {}, 'Plat indisponible'));

    let panier = await Panier.findOne({ clientId, tableId: tableId, actif: true });
    if (!panier) {
      panier = new Panier({ clientId, tableId: tableId, items: [] });
    }

    await panier.ajouterItem(platId, quantite, plat.prix, commentaires);
    if (!table.statutOccupee) await table.occuper(clientId);

    await panier.populate('items.platId', 'nom prix imageUrl disponible');
    await panier.populate('tableId', 'numero');

    Logger.success('Article ajouté panier', { clientId, platId, quantite });
    res.json(createResponse(true, { panier }, 'Article ajouté au panier'));
  } catch (err) {
    Logger.error('Erreur ajout panier', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// PUT modifier article
router.put('/:clientId/update-item', [
  body('platId').isMongoId(),
  body('tableId').isMongoId(),
  body('quantite').isInt({ min: 1 }),
  body('commentaires').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));

    const { platId, quantite, tableId, commentaires } = req.body;
    const clientId = req.params.clientId;
    const panier = await Panier.findOne({ clientId, tableId: tableId, actif: true });
    if (!panier) return res.status(404).json(createResponse(false, {}, 'Panier non trouvé'));

    const item = panier.items.find(item => item.platId.toString() === platId);
    if (!item) return res.status(404).json(createResponse(false, {}, 'Article non trouvé'));

    item.quantite = quantite;
    if (commentaires !== undefined) item.commentaires = commentaires;

    await panier.calculerTotal();
    await panier.save();
    await panier.populate('items.platId', 'nom prix imageUrl disponible');

    Logger.success('Article mis à jour panier', { clientId, platId, quantite });
    res.json(createResponse(true, { panier }, 'Article mis à jour'));
  } catch (err) {
    Logger.error('Erreur modification panier', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// DELETE supprimer article
router.delete('/:clientId/remove/:platId/:tableId', async (req, res) => {
  try {
    const { clientId, platId, tableId } = req.params;
    const panier = await Panier.findOne({ clientId, tableId: tableId, actif: true });
    if (!panier) return res.status(404).json(createResponse(false, {}, 'Panier non trouvé'));

    await panier.retirerItem(platId);
    await panier.populate('items.platId', 'nom prix imageUrl disponible');

    Logger.success('Article retiré panier', { clientId, platId });
    res.json(createResponse(true, { panier }, 'Article retiré'));
  } catch (err) {
    Logger.error('Erreur suppression article panier', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// DELETE vider panier
router.delete('/:clientId/clear/:tableId', async (req, res) => {
  try {
    const { clientId, tableId } = req.params;
    const panier = await Panier.findOne({ clientId, tableId: tableId, actif: true });
    if (!panier) return res.status(404).json(createResponse(false, {}, 'Panier non trouvé'));

    await panier.vider();

    Logger.success('Panier vidé', { clientId });
    res.json(createResponse(true, { panier }, 'Panier vidé'));
  } catch (err) {
    Logger.error('Erreur vidage panier', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// POST convertir panier en commande
router.post('/:clientId/convert-to-order', [
  body('modeCommande').optional().isIn(['sur_place','emporter']),
  body('commentaires').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));

    const { modeCommande = 'sur_place', commentaires = '', tableId } = req.body;
    const clientId = req.params.clientId;

    const panier = await Panier.findOne({ clientId, tableId: tableId, actif: true }).populate('items.platId', 'nom prix');
    if (!panier) return res.status(404).json(createResponse(false, {}, 'Panier non trouvé'));
    if (panier.items.length === 0) return res.status(400).json(createResponse(false, {}, 'Panier vide'));

    const commandeItems = panier.items.map(item => ({
      platId: item.platId._id,
      nom: item.platId.nom,
      quantite: item.quantite,
      prixUnitaire: item.prixUnitaire,
      commentaires: item.commentaires
    }));
    const Commande = require('../commande/commande.model');
    const commande = new Commande({ clientId, tableId: tableId, items: commandeItems, modeCommande, commentaires });
    commande.calculerTotal();
    await commande.save();

    panier.actif = false;
    await panier.save();

    const User = require('../user/user.model');
    await User.findByIdAndUpdate(clientId, { $push: { historiqueCommandes: commande._id } });

    await commande.populate('clientId', 'nom email');
    await commande.populate('tableId', 'numero');

    Logger.success('Panier converti en commande', { clientId, commandeId: commande._id });
    res.status(201).json(createResponse(true, { commande }, 'Commande créée'));
  } catch (err) {
    Logger.error('Erreur conversion panier', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET résumé panier
router.get('/:clientId/summary', async (req, res) => {
  try {
    const panier = await Panier.findOne({ clientId: req.params.clientId, actif: true })
      .populate('items.platId', 'nom prix')
      .populate('tableId', 'numero');

    if (!panier) {
      Logger.success('Résumé panier vide', { clientId: req.params.clientId });
      return res.json(createResponse(true, { itemsCount: 0, total: 0, devise: 'FCFA', table: null }, 'Résumé du panier'));
    }

    const itemsCount = panier.items.reduce((a, i) => a + i.quantite, 0);
    const summary = {
      itemsCount,
      total: panier.total,
      devise: panier.devise,
      table: panier.tableId ? { id: panier.tableId._id, numero: panier.tableId.numero } : null
    };

    Logger.success('Résumé panier récupéré', { clientId: req.params.clientId, itemsCount });
    res.json(createResponse(true, summary, 'Résumé du panier'));
  } catch (err) {
    Logger.error('Erreur résumé panier', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

module.exports = router;
