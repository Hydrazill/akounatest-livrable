
const express = require('express');
const { body, validationResult } = require('express-validator');

const Table = require('./table.model');
const { auth, adminAuth } = require('../auth/auth.middleware');
const { generateTableQRCode, validateTableQRCode } = require('../../utils/qrcode');
const Logger = require('../../utils/logger');
const { createResponse } = require('../../utils/helpers');

const router = express.Router();

// GET /api/table
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, disponible } = req.query;
    const query = {};
    if (disponible !== undefined) query.statutOccupee = disponible === 'false';

    const tables = await Table.find(query)
      .populate('clientActuel', 'nom email')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ numero: 1 });
    const total = await Table.countDocuments(query);

    res.json(createResponse(true, {
      tables,
      totalPages: Math.ceil(total / limit),
      currentPage: +page,
      total
    }, 'Tables récupérées avec succès'));
  } catch (err) {
    Logger.error('Erreur récupération tables', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

// GET /api/table/available
router.get('/available', async (req, res) => {
  try {
    const tables = await Table.find({ statutOccupee: false })
      .select('numero capacite')
      .sort({ numero: 1 });

    res.json(createResponse(true, { tables }, 'Tables disponibles'));
  } catch (err) {
    Logger.error('Erreur récupération tables disponibles', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

// GET /api/table/:id
router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).populate('clientActuel', 'nom email');
    if (!table) return res.status(404).json(createResponse(false, null, 'Table non trouvée'));

    res.json(createResponse(true, { table }, 'Table récupérée'));
  } catch (err) {
    Logger.error('Erreur récupération table', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

// POST /api/tables
router.post('/', [
  auth, adminAuth,
  body('numero').trim().notEmpty().withMessage('Le numéro est requis'),
  body('capacite').isInt({ min: 1, max: 20 }).withMessage('Capacité 1–20')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(createResponse(false, null, 'Données invalides', errors.array()));
  }
  try {
    const { numero, capacite, restaurantId = 'akounamatata_main' } = req.body;
    if (await Table.findOne({ numero })) {
      return res.status(400).json(createResponse(false, null, 'Table déjà existante'));
    }
    const table = new Table({ numero, capacite, restaurantId });
    await table.save();
    const { qrCode, qrCodeImage } = await generateTableQRCode(table._id, table.numero);
    table.qrCode = qrCode;
    await table.save();
    res.status(201).json(createResponse(true, { table, qrCodeImage }, 'Table créée'));
  } catch (err) {
    Logger.error('Erreur création table', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

// PUT /api/tables/:id
router.put('/:id', [
  auth, adminAuth,
  body('numero').optional().trim().notEmpty(),
  body('capacite').optional().isInt({ min: 1, max: 20 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(createResponse(false, null, 'Données invalides', errors.array()));
  }
  try {
    const { numero, capacite } = req.body;
    if (numero && await Table.findOne({ numero, _id: { $ne: req.params.id } })) {
      return res.status(400).json(createResponse(false, null, 'Table déjà existante'));
    }
    const { qrCode, qrCodeImage } = await generateTableQRCode(req.params.id, numero);
    const table = await Table.findByIdAndUpdate(req.params.id, { numero, capacite, qrCode }, { new: true, runValidators: true });
    if (!table) return res.status(404).json(createResponse(false, null, 'Table non trouvée'));

    res.json(createResponse(true, { table }, 'Table mise à jour'));
  } catch (err) {
    Logger.error('Erreur mise à jour table', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

// DELETE /api/tables/:id
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json(createResponse(false, null, 'Table non trouvée'));
    if (table.statutOccupee) {
      return res.status(400).json(createResponse(false, null, 'Table occupée, suppression impossible'));
    }
    await table.deleteOne();
    res.json(createResponse(true, null, 'Table supprimée'));
  } catch (err) {
    Logger.error('Erreur suppression table', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

// GET /api/tables/:id/qrcode
router.get('/:id/qrcode', auth, adminAuth, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json(createResponse(false, null, 'Table non trouvée'));

    if (!table.qrCode) {
      const { qrCode, qrCodeImage } = await generateTableQRCode(table._id, table.numero);
      table.qrCode = qrCode;
      await table.save();
      return res.json(createResponse(true, { qrCode, qrCodeImage }, 'QR code généré'));
    }

    const { qrCodeImage } = await generateTableQRCode(table._id, table.numero);
    res.json(createResponse(true, { qrCode: table.qrCode, qrCodeImage }, 'QR code récupéré'));
  } catch (err) {
    Logger.error('Erreur génération QR', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

// POST /api/table/:id/occupy
router.post('/:id/occupy',  async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json(createResponse(false, null, 'Table non trouvée'));
    if (table.statutOccupee) {
      return res.status(400).json(createResponse(false, null, 'Table déjà occupée'));
    }
    await table.occuper(req.user?._id || null);
    res.json(createResponse(true, { table }, 'Table occupée'));
  } catch (err) {
    Logger.error('Erreur occupation table', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

// POST /api/table/:id/free
router.post('/:id/free', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    console.log("table : ", table)
    if (!table) return res.status(404).json(createResponse(false, null, 'Table non trouvée'));
    if (!table.statutOccupee) {
      return res.status(400).json(createResponse(false, null, 'Table déjà libre'));
    }
    // if (req.user.role !== 'admin' && table.clientActuel?.toString() !== req.user._id.toString()) {
    //   return res.status(403).json(createResponse(false, null, 'Accès refusé'));
    // }
    await table.liberer();
    res.json(createResponse(true, { table }, 'Table libérée'));
  } catch (err) {
    Logger.error('Erreur libération table', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

// POST /api/tables/validate-qr
router.post('/validate-qr', [
  auth,
  body('qrCode').notEmpty().withMessage('QR code requis')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(createResponse(false, null, 'Données invalides', errors.array()));
  }
  try {
    const { qrCode } = req.body;
    const validation = validateTableQRCode(qrCode);
    if (!validation.valid) return res.status(400).json(createResponse(false, null, validation.message));

    const table = await Table.findById(validation.tableId);
    if (!table) return res.status(404).json(createResponse(false, null, 'Table non trouvée'));

    res.json(createResponse(true, {
      id: table._id,
      numero: table.numero,
      capacite: table.capacite,
      statutOccupee: table.statutOccupee
    }, 'QR code valide'));
  } catch (err) {
    Logger.error('Erreur validation QR', err);
    res.status(500).json(createResponse(false, null, 'Erreur interne serveur', err.message));
  }
});

module.exports = router;
