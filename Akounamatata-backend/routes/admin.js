const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Table = require('../models/Table');
const Commande = require('../models/Commande');
const Plat = require('../models/Plat');
const MenuDuJour = require('../models/MenuDuJour');
const Categorie = require('../models/Categorie');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Obtenir les données du dashboard admin
// @access  Private (Admin)
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Statistiques générales
    const totalUtilisateurs = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalTables = await Table.countDocuments();
    const tablesOccupees = await Table.countDocuments({ statutOccupee: true });
    const totalPlats = await Plat.countDocuments();
    const platsDisponibles = await Plat.countDocuments({ disponible: true });
    
    // Statistiques du jour
    const commandesAujourdhui = await Commande.countDocuments({
      dateCommande: { $gte: today, $lt: tomorrow }
    });
    
    const chiffreAffairesAujourdhui = await Commande.aggregate([
      {
        $match: {
          dateCommande: { $gte: today, $lt: tomorrow },
          statut: { $ne: 'annulee' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);
    
    // Commandes par statut aujourd'hui
    const commandesParStatut = await Commande.aggregate([
      {
        $match: {
          dateCommande: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Commandes récentes
    const commandesRecentes = await Commande.find()
      .populate('clientId', 'nom email')
      .populate('tableId', 'numero')
      .sort({ dateCommande: -1 })
      .limit(10);
    
    // Tables actuellement occupées
    const tablesOccupeesDetails = await Table.find({ statutOccupee: true })
      .populate('clientActuel', 'nom email')
      .sort({ numero: 1 });
    
    res.json({
      statistiques: {
        utilisateurs: {
          total: totalUtilisateurs,
          clients: totalClients,
          admins: totalUtilisateurs - totalClients
        },
        tables: {
          total: totalTables,
          occupees: tablesOccupees,
          libres: totalTables - tablesOccupees
        },
        plats: {
          total: totalPlats,
          disponibles: platsDisponibles,
          indisponibles: totalPlats - platsDisponibles
        },
        aujourdhui: {
          commandes: commandesAujourdhui,
          chiffreAffaires: chiffreAffairesAujourdhui[0]?.total || 0,
          commandesParStatut
        }
      },
      commandesRecentes,
      tablesOccupees: tablesOccupeesDetails
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/admin/operations
// @desc    Obtenir toutes les opérations récentes
// @access  Private (Admin)
router.get('/operations', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, dateDebut, dateFin } = req.query;
    
    let dateFilter = {};
    if (dateDebut || dateFin) {
      if (dateDebut) {
        dateFilter.$gte = new Date(dateDebut);
      }
      if (dateFin) {
        const endDate = new Date(dateFin);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
      }
    }
    
    const operations = [];
    
    // Récupérer les commandes
    if (!type || type === 'commande') {
      const commandes = await Commande.find(
        dateFilter.constructor === Object && Object.keys(dateFilter).length > 0 
          ? { dateCommande: dateFilter }
          : {}
      )
        .populate('clientId', 'nom email')
        .populate('tableId', 'numero')
        .sort({ dateCommande: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      commandes.forEach(commande => {
        operations.push({
          type: 'commande',
          id: commande._id,
          description: `Commande ${commande.numero} - Table ${commande.tableId?.numero || 'N/A'}`,
          utilisateur: commande.clientId?.nom || 'Utilisateur supprimé',
          montant: commande.total,
          statut: commande.statut,
          date: commande.dateCommande,
          details: {
            numero: commande.numero,
            table: commande.tableId?.numero,
            items: commande.items.length,
            total: commande.total
          }
        });
      });
    }
    
    // Récupérer les nouvelles inscriptions
    if (!type || type === 'inscription') {
      const inscriptions = await User.find(
        dateFilter.constructor === Object && Object.keys(dateFilter).length > 0 
          ? { dateCreation: dateFilter }
          : {}
      )
        .sort({ dateCreation: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      inscriptions.forEach(user => {
        operations.push({
          type: 'inscription',
          id: user._id,
          description: `Nouvelle inscription - ${user.role}`,
          utilisateur: user.nom,
          email: user.email,
          statut: 'actif',
          date: user.dateCreation,
          details: {
            role: user.role,
            email: user.email,
            telephone: user.telephone
          }
        });
      });
    }
    
    // Trier toutes les opérations par date
    operations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      operations: operations.slice(0, limit),
      totalPages: Math.ceil(operations.length / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des opérations:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Obtenir les analyses et statistiques avancées
// @access  Private (Admin)
router.get('/analytics', auth, adminAuth, async (req, res) => {
  try {
    const { periode = 'month' } = req.query;
    
    let dateDebut, dateFin;
    const now = new Date();
    
    switch (periode) {
      case 'week':
        dateDebut = new Date(now);
        dateDebut.setDate(now.getDate() - 7);
        dateFin = now;
        break;
      case 'month':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        dateDebut = new Date(now.getFullYear(), 0, 1);
        dateFin = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    
    // Évolution des ventes par jour
    const ventesParJour = await Commande.aggregate([
      {
        $match: {
          dateCommande: { $gte: dateDebut, $lt: dateFin },
          statut: { $ne: 'annulee' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$dateCommande' }
          },
          nombreCommandes: { $sum: 1 },
          chiffreAffaires: { $sum: '$total' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Plats les plus vendus
    const platsPopulaires = await Commande.aggregate([
      {
        $match: {
          dateCommande: { $gte: dateDebut, $lt: dateFin },
          statut: { $ne: 'annulee' }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.platId',
          nom: { $first: '$items.nom' },
          quantiteVendue: { $sum: '$items.quantite' },
          chiffreAffaires: { $sum: { $multiply: ['$items.quantite', '$items.prixUnitaire'] } }
        }
      },
      {
        $sort: { quantiteVendue: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Répartition par statut de commande
    const repartitionStatuts = await Commande.aggregate([
      {
        $match: {
          dateCommande: { $gte: dateDebut, $lt: dateFin }
        }
      },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          pourcentage: { $sum: 1 }
        }
      }
    ]);
    
    // Calcul des pourcentages
    const totalCommandes = repartitionStatuts.reduce((sum, item) => sum + item.count, 0);
    repartitionStatuts.forEach(item => {
      item.pourcentage = totalCommandes > 0 ? (item.count / totalCommandes * 100).toFixed(2) : 0;
    });
    
    // Heures de pointe
    const heuresPointe = await Commande.aggregate([
      {
        $match: {
          dateCommande: { $gte: dateDebut, $lt: dateFin },
          statut: { $ne: 'annulee' }
        }
      },
      {
        $group: {
          _id: { $hour: '$dateCommande' },
          nombreCommandes: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Tables les plus utilisées
    const tablesPopulaires = await Commande.aggregate([
      {
        $match: {
          dateCommande: { $gte: dateDebut, $lt: dateFin },
          statut: { $ne: 'annulee' }
        }
      },
      {
        $lookup: {
          from: 'tables',
          localField: 'tableId',
          foreignField: '_id',
          as: 'table'
        }
      },
      {
        $unwind: '$table'
      },
      {
        $group: {
          _id: '$tableId',
          numeroTable: { $first: '$table.numero' },
          nombreCommandes: { $sum: 1 },
          chiffreAffaires: { $sum: '$total' }
        }
      },
      {
        $sort: { nombreCommandes: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.json({
      periode,
      dateDebut,
      dateFin,
      ventesParJour,
      platsPopulaires,
      repartitionStatuts,
      heuresPointe,
      tablesPopulaires
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/admin/users/stats
// @desc    Obtenir les statistiques des utilisateurs
// @access  Private (Admin)
router.get('/users/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const clientsCount = await User.countDocuments({ role: 'client' });
    const adminsCount = await User.countDocuments({ role: 'admin' });
    
    // Nouvelles inscriptions par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const inscriptionsParMois = await User.aggregate([
      {
        $match: {
          dateCreation: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateCreation' },
            month: { $month: '$dateCreation' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Utilisateurs actifs (qui ont passé une commande dans les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const utilisateursActifs = await Commande.distinct('clientId', {
      dateCommande: { $gte: thirtyDaysAgo }
    });
    
    res.json({
      total: totalUsers,
      clients: clientsCount,
      admins: adminsCount,
      utilisateursActifs: utilisateursActifs.length,
      inscriptionsParMois
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques utilisateurs:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/admin/notifications
// @desc    Envoyer une notification à tous les utilisateurs ou à un utilisateur spécifique
// @access  Private (Admin)
router.post('/notifications', [
  auth,
  adminAuth,
  body('message').trim().notEmpty().withMessage('Le message est requis'),
  body('type').optional().isIn(['info', 'warning', 'success', 'error']).withMessage('Type invalide'),
  body('userId').optional().isMongoId().withMessage('ID utilisateur invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { message, type = 'info', userId } = req.body;
    
    const notification = {
      message,
      type,
      date: new Date(),
      lu: false
    };
    
    let result;
    if (userId) {
      // Notification à un utilisateur spécifique
      result = await User.findByIdAndUpdate(
        userId,
        { $push: { notifications: notification } },
        { new: true }
      );
      
      if (!result) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
    } else {
      // Notification à tous les utilisateurs
      result = await User.updateMany(
        {},
        { $push: { notifications: notification } }
      );
    }
    
    res.json({
      message: 'Notification envoyée avec succès',
      destinataires: userId ? 1 : result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/admin/export/commandes
// @desc    Exporter les données des commandes
// @access  Private (Admin)
router.get('/export/commandes', auth, adminAuth, async (req, res) => {
  try {
    const { format = 'json', dateDebut, dateFin } = req.query;
    
    let query = {};
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
      .sort({ dateCommande: -1 });
    
    if (format === 'csv') {
      // Conversion en CSV (simplifié)
      const csvData = commandes.map(commande => ({
        numero: commande.numero,
        client: commande.clientId?.nom || 'N/A',
        table: commande.tableId?.numero || 'N/A',
        total: commande.total,
        statut: commande.statut,
        date: commande.dateCommande.toISOString()
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=commandes.csv');
      
      // En-têtes CSV
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      
      res.send([headers, ...rows].join('\n'));
    } else {
      res.json({ commandes });
    }
  } catch (error) {
    console.error('Erreur lors de l\'export des commandes:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;

