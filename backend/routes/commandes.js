const express = require('express');
const { body, validationResult } = require('express-validator');
const Commande = require('../models/Commande');
const { auth, adminAuth, ownerAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/commandes
// @desc    Obtenir toutes les commandes (admin) ou les commandes d'un client
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      clientId,
      tableId,
      dateDebut,
      dateFin
    } = req.query;
    
    let query = {};
    
    // Si l'utilisateur n'est pas admin, il ne peut voir que ses propres commandes
    if (req.user.role !== 'admin') {
      query.clientId = req.user._id;
    } else {
      // Admin peut filtrer par client
      if (clientId) {
        query.clientId = clientId;
      }
    }
    
    if (statut) {
      query.statut = statut;
    }
    
    if (tableId) {
      query.tableId = tableId;
    }
    
    if (dateDebut || dateFin) {
      query.dateCommande = {};
      if (dateDebut) {
        query.dateCommande.$gte = new Date(dateDebut);
      }
      if (dateFin) {
        const endDate = new Date(dateFin);
        endDate.setHours(23, 59, 59, 999);
        query.dateCommande.$lte = endDate;
      }
    }
    
    const commandes = await Commande.find(query)
      .populate('clientId', 'nom email')
      .populate('tableId', 'numero')
      .populate('items.platId', 'nom prix')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dateCommande: -1 });
    
    const total = await Commande.countDocuments(query);
    
    res.json({
      commandes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/commandes/stats
// @desc    Obtenir les statistiques des commandes (admin seulement)
// @access  Private (Admin)
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const { periode = 'today' } = req.query;
    
    let dateDebut, dateFin;
    const now = new Date();
    
    switch (periode) {
      case 'today':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFin = new Date(dateDebut);
        dateFin.setDate(dateFin.getDate() + 1);
        break;
      case 'week':
        dateDebut = new Date(now);
        dateDebut.setDate(now.getDate() - 7);
        dateFin = now;
        break;
      case 'month':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFin = new Date(dateDebut);
        dateFin.setDate(dateFin.getDate() + 1);
    }
    
    const stats = await Commande.aggregate([
      {
        $match: {
          dateCommande: { $gte: dateDebut, $lt: dateFin }
        }
      },
      {
        $group: {
          _id: null,
          totalCommandes: { $sum: 1 },
          chiffreAffaires: { $sum: '$total' },
          commandesParStatut: {
            $push: {
              statut: '$statut',
              total: '$total'
            }
          }
        }
      }
    ]);
    
    const statutStats = await Commande.aggregate([
      {
        $match: {
          dateCommande: { $gte: dateDebut, $lt: dateFin }
        }
      },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          totalMontant: { $sum: '$total' }
        }
      }
    ]);
    
    res.json({
      periode,
      dateDebut,
      dateFin,
      stats: stats[0] || { totalCommandes: 0, chiffreAffaires: 0 },
      statutStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/commandes/:id
// @desc    Obtenir une commande par ID
// @access  Private (Owner ou Admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('clientId', 'nom email telephone')
      .populate('tableId', 'numero capacite')
      .populate('items.platId', 'nom description prix imageUrl')
      .populate('menuDuJourId', 'titre date');
    
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    // Vérifier que l'utilisateur peut accéder à cette commande
    if (req.user.role !== 'admin' && commande.clientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    res.json({ commande });
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   PUT /api/commandes/:id/status
// @desc    Mettre à jour le statut d'une commande
// @access  Private (Admin)
router.put('/:id/status', [
  auth,
  adminAuth,
  body('statut').isIn(['en_attente', 'confirmee', 'en_preparation', 'prete', 'livree', 'annulee'])
    .withMessage('Statut invalide'),
  body('commentaire').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { statut, commentaire = '' } = req.body;
    
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    await commande.changerStatut(statut, commentaire);
    await commande.populate('clientId', 'nom email');
    await commande.populate('tableId', 'numero');
    
    res.json({
      message: 'Statut de la commande mis à jour avec succès',
      commande
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/commandes/client/:clientId/history
// @desc    Obtenir l'historique des commandes d'un client
// @access  Private (Owner ou Admin)
router.get('/client/:clientId/history', auth, ownerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const commandes = await Commande.find({ clientId: req.params.clientId })
      .populate('tableId', 'numero')
      .populate('items.platId', 'nom prix')
      .select('numero total statut dateCommande items')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dateCommande: -1 });
    
    const total = await Commande.countDocuments({ clientId: req.params.clientId });
    
    res.json({
      commandes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/commandes/table/:tableId
// @desc    Obtenir les commandes d'une table
// @access  Private (Admin)
router.get('/table/:tableId', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, statut } = req.query;
    const query = { tableId: req.params.tableId };
    
    if (statut) {
      query.statut = statut;
    }
    
    const commandes = await Commande.find(query)
      .populate('clientId', 'nom email')
      .populate('items.platId', 'nom prix')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dateCommande: -1 });
    
    const total = await Commande.countDocuments(query);
    
    res.json({
      commandes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes de la table:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/commandes/:id
// @desc    Annuler une commande
// @access  Private (Admin ou Client propriétaire si statut permet)
router.delete('/:id', auth, async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id);
    
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    // Vérifier les permissions
    const isOwner = commande.clientId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    // Vérifier que la commande peut être annulée
    if (['livree', 'annulee'].includes(commande.statut)) {
      return res.status(400).json({ message: 'Cette commande ne peut plus être annulée' });
    }
    
    // Si c'est un client, il ne peut annuler que si la commande n'est pas encore confirmée
    if (isOwner && !isAdmin && commande.statut !== 'en_attente') {
      return res.status(400).json({ message: 'Vous ne pouvez plus annuler cette commande' });
    }
    
    await commande.changerStatut('annulee', 'Commande annulée par ' + (isAdmin ? 'l\'administrateur' : 'le client'));
    
    res.json({
      message: 'Commande annulée avec succès',
      commande
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la commande:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/commandes/pending/kitchen
// @desc    Obtenir les commandes en attente pour la cuisine
// @access  Private (Admin)
router.get('/pending/kitchen', auth, adminAuth, async (req, res) => {
  try {
    const commandes = await Commande.find({
      statut: { $in: ['confirmee', 'en_preparation'] }
    })
      .populate('clientId', 'nom')
      .populate('tableId', 'numero')
      .populate('items.platId', 'nom tempsPreparation')
      .sort({ dateCommande: 1 });
    
    res.json({ commandes });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes pour la cuisine:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;

