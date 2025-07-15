const express = require('express');
const { body, validationResult } = require('express-validator');
const Panier = require('../models/Panier');
const Plat = require('../models/Plat');
const Table = require('../models/Table');
const { auth, clientAuth, ownerAuth } = require('../middleware/auth');
const { validateTableQRCode } = require('../utils/qrcode');

const router = express.Router();

// @route   GET /api/paniers/:clientId
// @desc    Obtenir le panier d'un client
// @access  Private (Owner ou Admin)
router.get('/:clientId', auth, ownerAuth, async (req, res) => {
  try {
    const panier = await Panier.findOne({ 
      clientId: req.params.clientId, 
      actif: true 
    })
      .populate('items.platId', 'nom prix imageUrl disponible')
      .populate('tableId', 'numero')
      .populate('clientId', 'nom email');
    
    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }
    
    res.json({ panier });
  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/paniers/:clientId/add
// @desc    Ajouter un article au panier (nécessite le scan QR de la table)
// @access  Private (Client)
router.post('/:clientId/add', [
  auth,
  ownerAuth,
  body('platId').isMongoId().withMessage('ID de plat invalide'),
  body('quantite').isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  body('qrCode').notEmpty().withMessage('QR code de la table requis'),
  body('commentaires').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { platId, quantite, qrCode, commentaires = '' } = req.body;
    const clientId = req.params.clientId;
    
    // Valider le QR code de la table
    const qrValidation = validateTableQRCode(qrCode);
    if (!qrValidation.valid) {
      return res.status(400).json({ message: qrValidation.message });
    }
    
    // Vérifier que la table existe
    const table = await Table.findById(qrValidation.tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }
    
    // Vérifier que le plat existe et est disponible
    const plat = await Plat.findById(platId);
    if (!plat) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }
    
    if (!plat.disponible) {
      return res.status(400).json({ message: 'Ce plat n\'est pas disponible' });
    }
    
    // Chercher un panier actif pour ce client
    let panier = await Panier.findOne({ 
      clientId, 
      actif: true 
    });
    
    // Si pas de panier ou panier pour une autre table, créer un nouveau panier
    if (!panier || panier.tableId.toString() !== qrValidation.tableId) {
      // Désactiver l'ancien panier s'il existe
      if (panier) {
        panier.actif = false;
        await panier.save();
      }
      
      // Créer un nouveau panier
      panier = new Panier({
        clientId,
        tableId: qrValidation.tableId,
        items: []
      });
    }
    
    // Ajouter l'item au panier
    await panier.ajouterItem(platId, quantite, plat.prix, commentaires);
    
    // Occuper la table si elle ne l'est pas déjà
    if (!table.statutOccupee) {
      await table.occuper(clientId);
    }
    
    await panier.populate('items.platId', 'nom prix imageUrl disponible');
    await panier.populate('tableId', 'numero');
    
    res.json({
      message: 'Article ajouté au panier avec succès',
      panier
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   PUT /api/paniers/:clientId/update-item
// @desc    Mettre à jour la quantité d'un article dans le panier
// @access  Private (Client)
router.put('/:clientId/update-item', [
  auth,
  ownerAuth,
  body('platId').isMongoId().withMessage('ID de plat invalide'),
  body('quantite').isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  body('commentaires').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { platId, quantite, commentaires } = req.body;
    const clientId = req.params.clientId;
    
    const panier = await Panier.findOne({ 
      clientId, 
      actif: true 
    });
    
    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }
    
    // Trouver l'item dans le panier
    const item = panier.items.find(item => item.platId.toString() === platId);
    if (!item) {
      return res.status(404).json({ message: 'Article non trouvé dans le panier' });
    }
    
    // Mettre à jour l'item
    item.quantite = quantite;
    if (commentaires !== undefined) {
      item.commentaires = commentaires;
    }
    
    panier.calculerTotal();
    await panier.save();
    await panier.populate('items.platId', 'nom prix imageUrl disponible');
    
    res.json({
      message: 'Article mis à jour avec succès',
      panier
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du panier:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/paniers/:clientId/remove/:platId
// @desc    Retirer un article du panier
// @access  Private (Client)
router.delete('/:clientId/remove/:platId', auth, ownerAuth, async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const platId = req.params.platId;
    
    const panier = await Panier.findOne({ 
      clientId, 
      actif: true 
    });
    
    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }
    
    await panier.retirerItem(platId);
    await panier.populate('items.platId', 'nom prix imageUrl disponible');
    
    res.json({
      message: 'Article retiré du panier avec succès',
      panier
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/paniers/:clientId/clear
// @desc    Vider le panier
// @access  Private (Client)
router.delete('/:clientId/clear', auth, ownerAuth, async (req, res) => {
  try {
    const clientId = req.params.clientId;
    
    const panier = await Panier.findOne({ 
      clientId, 
      actif: true 
    });
    
    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }
    
    await panier.vider();
    
    res.json({
      message: 'Panier vidé avec succès',
      panier
    });
  } catch (error) {
    console.error('Erreur lors du vidage du panier:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/paniers/:clientId/convert-to-order
// @desc    Convertir le panier en commande
// @access  Private (Client)
router.post('/:clientId/convert-to-order', [
  auth,
  ownerAuth,
  body('modeCommande').optional().isIn(['sur_place', 'emporter']).withMessage('Mode de commande invalide'),
  body('commentaires').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { modeCommande = 'sur_place', commentaires = '' } = req.body;
    const clientId = req.params.clientId;
    
    const panier = await Panier.findOne({ 
      clientId, 
      actif: true 
    }).populate('items.platId', 'nom prix');
    
    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }
    
    if (panier.items.length === 0) {
      return res.status(400).json({ message: 'Le panier est vide' });
    }
    
    // Créer la commande
    const Commande = require('../models/Commande');
    
    const commandeItems = panier.items.map(item => ({
      platId: item.platId._id,
      nom: item.platId.nom,
      quantite: item.quantite,
      prixUnitaire: item.prixUnitaire,
      commentaires: item.commentaires
    }));
    
    const commande = new Commande({
      clientId,
      tableId: panier.tableId,
      items: commandeItems,
      modeCommande,
      commentaires
    });
    
    // Calculer le total
    commande.calculerTotal();
    await commande.save();
    
    // Désactiver le panier
    panier.actif = false;
    await panier.save();
    
    // Ajouter la commande à l'historique du client
    const User = require('../models/User');
    await User.findByIdAndUpdate(clientId, {
      $push: { historiqueCommandes: commande._id }
    });
    
    await commande.populate('clientId', 'nom email');
    await commande.populate('tableId', 'numero');
    
    res.status(201).json({
      message: 'Commande créée avec succès',
      commande
    });
  } catch (error) {
    console.error('Erreur lors de la conversion en commande:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/paniers/:clientId/summary
// @desc    Obtenir un résumé du panier
// @access  Private (Client)
router.get('/:clientId/summary', auth, ownerAuth, async (req, res) => {
  try {
    const panier = await Panier.findOne({ 
      clientId: req.params.clientId, 
      actif: true 
    })
      .populate('items.platId', 'nom prix')
      .populate('tableId', 'numero');
    
    if (!panier) {
      return res.json({
        itemsCount: 0,
        total: 0,
        devise: 'FCFA',
        table: null
      });
    }
    
    const itemsCount = panier.items.reduce((total, item) => total + item.quantite, 0);
    
    res.json({
      itemsCount,
      total: panier.total,
      devise: panier.devise,
      table: panier.tableId ? {
        id: panier.tableId._id,
        numero: panier.tableId.numero
      } : null
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé du panier:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;

