const express = require('express');
const config = require('../../config/index.js');
const { createResponse } = require('../../utils/helpers.js');

const router = express.Router();

// Route de vérification de santé
router.get('/', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '1.0.0',
    services: {}
  };

  res.json(createResponse(true, healthData, 'Service en ligne'));
});

// Route de vérification détaillée
router.get('/detailed', (req, res) => {
  const detailedHealth = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: new Date(process.uptime() * 1000).toISOString().substr(11, 8)
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    },
    environment: config.nodeEnv,
    version: '1.0.0',
    services: {}
  };

  res.json(createResponse(true, detailedHealth, 'Santé détaillée du service'));
});

module.exports = router;

