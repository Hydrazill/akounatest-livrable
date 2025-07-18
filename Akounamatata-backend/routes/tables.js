const express = require('express');
const { body, validationResult } = require('express-validator');
const Table = require('../models/Table');
const { auth, adminAuth } = require('../middleware/auth');
const { generateTableQRCode, validateTableQRCode } = require('../utils/qrcode');

const router = express.Router();

// @route   GET /api/tables
// @desc    Obtenir toutes les tables
// @access  Private (Admin)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, disponible } = req.query;
    const query = {};
    
    if (disponible !== undefined) {
      query.statutOccupee = disponible === 'false';
    }
    
    const tables = await Table.find(query)
      .populate('clientActuel', 'nom email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ numero: 1 });
    
    const total = await Table.countDocuments(query);
    
    res.json({
      tables,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/tables/available
// @desc    Obtenir les tables disponibles
// @access  Public
router.get('/available', async (req, res) => {
  try {
    const tables = await Table.find({ statutOccupee: false })
      .select('numero capacite')
      .sort({ numero: 1 });
    
    res.json({ tables });
  } catch (error) {
    console.error('Erreur lors de la récupération des tables disponibles:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/tables/:id
// @desc    Obtenir une table par ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('clientActuel', 'nom email');
    
    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }
    
    res.json({ table });
  } catch (error) {
    console.error('Erreur lors de la récupération de la table:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/tables
// @desc    Créer une nouvelle table
// @access  Private (Admin)
router.post('/', [
  auth,
  adminAuth,
  body('numero').trim().notEmpty().withMessage('Le numéro de table est requis'),
  body('capacite').isInt({ min: 1, max: 20 }).withMessage('La capacité doit être entre 1 et 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { numero, capacite, restaurantId = 'akounamatata_main' } = req.body;
    
    // Vérifier si le numéro de table existe déjà
    const existingTable = await Table.findOne({ numero });
    if (existingTable) {
      return res.status(400).json({ message: 'Une table avec ce numéro existe déjà' });
    }
    
    const table = new Table({
      numero,
      capacite,
      restaurantId
    });
    
    await table.save();
    
    // Générer le QR code
    const { qrCode, qrCodeImage } = await generateTableQRCode(table._id, table.numero);
    table.qrCode = qrCode;
    await table.save();
    
    res.status(201).json({
      message: 'Table créée avec succès',
      table,
      qrCodeImage
    });
  } catch (error) {
    console.error('Erreur lors de la création de la table:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   PUT /api/tables/:id
// @desc    Mettre à jour une table
// @access  Private (Admin)
router.put('/:id', [
  auth,
  adminAuth,
  body('numero').optional().trim().notEmpty().withMessage('Le numéro de table ne peut pas être vide'),
  body('capacite').optional().isInt({ min: 1, max: 20 }).withMessage('La capacité doit être entre 1 et 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { numero, capacite } = req.body;
    const updateData = {};
    
    if (numero) updateData.numero = numero;
    if (capacite) updateData.capacite = capacite;
    
    // Vérifier si le nouveau numéro existe déjà
    if (numero) {
      const existingTable = await Table.findOne({ numero, _id: { $ne: req.params.id } });
      if (existingTable) {
        return res.status(400).json({ message: 'Une table avec ce numéro existe déjà' });
      }
    }
    
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }
    
    res.json({
      message: 'Table mise à jour avec succès',
      table
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la table:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   DELETE /api/tables/:id
// @desc    Supprimer une table
// @access  Private (Admin)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }
    
    if (table.statutOccupee) {
      return res.status(400).json({ message: 'Impossible de supprimer une table occupée' });
    }
    
    await Table.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Table supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la table:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   GET /api/tables/:id/qrcode
// @desc    Obtenir le QR code d'une table
// @access  Private (Admin)
router.get('/:id/qrcode', auth, adminAuth, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }
    
    // Régénérer le QR code si nécessaire
    if (!table.qrCode) {
      const { qrCode, qrCodeImage } = await generateTableQRCode(table._id, table.numero);
      table.qrCode = qrCode;
      await table.save();
      
      return res.json({
        qrCode: qrCode,
        qrCodeImage: qrCodeImage
      });
    }
    
    // Générer l'image du QR code existant
    const { qrCodeImage } = await generateTableQRCode(table._id, table.numero);
    
    res.json({
      qrCode: table.qrCode,
      qrCodeImage: qrCodeImage
    });
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/tables/:id/occupy
// @desc    Marquer une table comme occupée
// @access  Private
router.post('/:id/occupy', auth, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }
    
    if (table.statutOccupee) {
      return res.status(400).json({ message: 'Table déjà occupée' });
    }
    
    await table.occuper(req.user._id);
    
    res.json({
      message: 'Table marquée comme occupée',
      table
    });
  } catch (error) {
    console.error('Erreur lors de l\'occupation de la table:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/tables/:id/free
// @desc    Libérer une table
// @access  Private (Admin ou client actuel)
router.post('/:id/free', auth, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }
    
    if (!table.statutOccupee) {
      return res.status(400).json({ message: 'Table déjà libre' });
    }
    
    // Vérifier que l'utilisateur peut libérer la table
    if (req.user.role !== 'admin' && table.clientActuel?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez pas libérer cette table' });
    }
    
    await table.liberer();
    
    res.json({
      message: 'Table libérée avec succès',
      table
    });
  } catch (error) {
    console.error('Erreur lors de la libération de la table:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/tables/validate-qr
// @desc    Valider un QR code de table
// @access  Private
router.post('/validate-qr', [
  auth,
  body('qrCode').notEmpty().withMessage('QR code requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { qrCode } = req.body;
    
    // Valider le QR code
    const validation = validateTableQRCode(qrCode);
    
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    
    // Vérifier que la table existe
    const table = await Table.findById(validation.tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }
    
    res.json({
      message: 'QR code valide',
      table: {
        id: table._id,
        numero: table.numero,
        capacite: table.capacite,
        statutOccupee: table.statutOccupee
      }
    });
  } catch (error) {
    console.error('Erreur lors de la validation du QR code:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;

