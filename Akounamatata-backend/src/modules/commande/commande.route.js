
const express = require('express');
const { body, validationResult } = require('express-validator');

const Commande = require('./commande.model');
const { auth, adminAuth, ownerAuth } = require('../auth/auth.middleware');
const Logger = require('../../utils/logger');
const { createResponse } = require('../../utils/helpers');

const router = express.Router();

// GET /api/commandes
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, clientId, tableId, dateDebut, dateFin } = req.query;
    const query = {};
    if (req.user.role !== 'admin') query.clientId = req.user._id;
    else if (clientId) query.clientId = clientId;
    if (statut) query.statut = statut;
    if (tableId) query.tableId = tableId;
    if (dateDebut || dateFin) {
      query.dateCommande = {};
      if (dateDebut) query.dateCommande.$gte = new Date(dateDebut);
      if (dateFin) {
        const end = new Date(dateFin);
        end.setHours(23,59,59,999);
        query.dateCommande.$lte = end;
      }
    }

    const commandes = await Commande.find(query)
      .populate('clientId', 'nom email')
      .populate('tableId', 'numero')
      .populate('items.platId', 'nom prix')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ dateCommande: -1 });
    const total = await Commande.countDocuments(query);

    Logger.success('Commandes récupérées', { total, page });
    res.json(createResponse(true, { commandes, totalPages: Math.ceil(total/limit), currentPage: +page, total }, 'Commandes récupérées'));
  } catch (err) {
    Logger.error('Erreur récupération commandes', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/commandes/stats
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const { periode = 'today' } = req.query;
    const now = new Date();
    let dateDebut, dateFin;
    switch (periode) {
      case 'week':
        dateDebut = new Date(now); dateDebut.setDate(now.getDate() - 7);
        dateFin = now;
        break;
      case 'month':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = new Date(now.getFullYear(), now.getMonth()+1,1);
        break;
      default:
        dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFin = new Date(dateDebut);
        dateFin.setDate(dateDebut.getDate()+1);
    }

    const [statsAgg] = await Commande.aggregate([
      { $match: { dateCommande: { $gte: dateDebut, $lt: dateFin } } },
      { $group: { _id: null, totalCommandes: { $sum:1 }, chiffreAffaires: { $sum:'$total' } } }
    ]);
    const statutStats = await Commande.aggregate([
      { $match: { dateCommande: { $gte: dateDebut, $lt: dateFin } } },
      { $group: { _id: '$statut', count: { $sum:1 }, totalMontant: { $sum:'$total' } } }
    ]);

    Logger.success('Statistiques des commandes récupérées', { periode });
    res.json(createResponse(true, { periode, dateDebut, dateFin, stats: statsAgg || { totalCommandes:0, chiffreAffaires:0 }, statutStats }, 'Statistiques récupérées'));
  } catch (err) {
    Logger.error('Erreur récupération stats commandes', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/commandes/:id
router.get('/:clientId/:tableId', auth, async (req, res) => {
  try {
    const { clientId, tableId } = req.params;
    const params = { clientId: clientId, tableId: tableId, statut: "en_attente" }
    const commande = await Commande.findOne(params) // findById(req.params.id)
      .populate('clientId', 'nom email telephone')
      .populate('tableId', 'numero capacite')
      .populate('items.platId', 'nom description prix imageUrl')
      .populate('menuDuJourId', 'titre date');
    if (!commande) return res.status(404).json(createResponse(false, {}, 'Commande non trouvée'));

    if (req.user.role !== 'admin' && commande.clientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json(createResponse(false, {}, 'Accès refusé'));
    }

    Logger.success('Commande récupérée', { id: commande._id });
    res.json(createResponse(true, { commande }, 'Commande récupérée'));
  } catch (err) {
    Logger.error('Erreur récupération commande', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// PUT /api/commandes/:id/status
router.put('/:id/status', auth, adminAuth, [
  body('statut').isIn(['en_attente','confirmee','en_preparation','prete','livree','annulee']).withMessage('Statut invalide'),
  body('commentaire').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(createResponse(false, { errors: errors.array() }, 'Données invalides'));

    const { statut, commentaire = '' } = req.body;
    const commande = await Commande.findById(req.params.id);
    if (!commande) return res.status(404).json(createResponse(false, {}, 'Commande non trouvée'));

    await commande.changerStatut(statut, commentaire);
    await commande.populate('clientId', 'nom email');
    await commande.populate('tableId', 'numero');

    Logger.success('Statut commande mis à jour', { id: commande._id, statut });
    res.json(createResponse(true, { commande }, 'Statut de la commande mis à jour'));
  } catch (err) {
    Logger.error('Erreur mise à jour statut commande', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// DELETE /api/commandes/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id);
    if (!commande) return res.status(404).json(createResponse(false, {}, 'Commande non trouvée'));

    const isOwner = commande.clientId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json(createResponse(false, {}, 'Accès refusé'));
    if (['livree','annulee'].includes(commande.statut)) {
      return res.status(400).json(createResponse(false, {}, 'Commande ne peut plus être annulée'));
    }
    if (isOwner && !isAdmin && commande.statut !== 'en_attente') {
      return res.status(400).json(createResponse(false, {}, 'Impossible d’annuler cette commande'));
    }

    await commande.changerStatut('annulee', isAdmin ? 'Annulée par admin' : 'Annulée par client');

    Logger.success('Commande annulée', { id: commande._id, by: isAdmin ? 'admin' : 'client' });
    res.json(createResponse(true, { commande }, 'Commande annulée'));
  } catch (err) {
    Logger.error('Erreur annulation commande', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

// GET /api/commandes/pending/kitchen
router.get('/pending/kitchen', auth, adminAuth, async (req, res) => {
  try {
    const commandes = await Commande.find({ statut: { $in: ['confirmee','en_preparation'] } })
      .populate('clientId', 'nom')
      .populate('tableId', 'numero')
      .populate('items.platId', 'nom tempsPreparation')
      .sort({ dateCommande: 1 });

    Logger.success('Commandes pending cuisine récupérées', { count: commandes.length });
    res.json(createResponse(true, { commandes }, 'Commandes en attente pour la cuisine récupérées'));
  } catch (err) {
    Logger.error('Erreur récupération commandes pending', err);
    res.status(500).json(createResponse(false, {}, 'Erreur interne du serveur'));
  }
});

module.exports = router;
