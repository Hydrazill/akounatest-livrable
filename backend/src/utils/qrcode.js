
const QRCode = require('qrcode');
const url = require('url');

const Logger = require('./logger');
const config = require('../config');

// Générer un QR code pour une table
const generateTableQRCode = async (tableId, tableNumber) => {

  try {
    const qrData = {
      type: 'table',
      id: tableId,
      number: tableNumber,
      timestamp: Date.now()
    };
    
    const qrString = `${config.corsOrigin}/menu/?type=${qrData.type}&id=${qrData.id}&number=${qrData.number}&timestamp=${qrData.timestamp}`; // JSON.stringify(qrData);

    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    Logger.success('QR Code généré', { tableId, tableNumber });

    return {
      qrCode: qrString,
      qrCodeImage: qrCodeDataURL
    };

  } catch (error) {
    Logger.error('Erreur génération QR Code', error);
    throw new Error('Erreur lors de la génération du QR code: ' + error.message);
  }
};

// Valider un QR code de table
const validateTableQRCode = (qrCodeString) => {
  try {
    const qrData = parseQRString(qrCodeString);

    if (qrData.type !== 'table' || !qrData.tableId || !qrData.tableNumber) {
      Logger.error('QR Code invalide - champs manquants', qrData);
      return { valid: false, message: 'QR code invalide' };
    }

    // const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    // const age = Date.now() - qrData.timestamp;

    // if (age > maxAge) {
    //   Logger.error('QR Code expiré', { tableId: qrData.tableId, age });
    //   return { valid: false, message: 'QR code expiré' };
    // }

    Logger.success('QR Code valide', { tableId: qrData.tableId, tableNumber: qrData.tableNumber });
    return {
      valid: true,
      tableId: qrData.tableId,
      tableNumber: qrData.tableNumber
    };

  } catch (error) {
    Logger.error('Erreur parsing QR Code', error);
    return { valid: false, message: 'Format de QR code invalide' };
  }
};

// parser une url
const parseQRString = (qrString) => {
  try {
    const parsedUrl = new URL(qrString);
    const searchParams = parsedUrl.searchParams;

    const qrData = {
      type: searchParams.get('type'),
      id: searchParams.get('id'),
      number: searchParams.get('number'),
      timestamp: Number(searchParams.get('timestamp'))
    };

    return qrData;
  } catch (error) {
    throw new Error('QR string invalide : ' + error.message);
  }
};

module.exports = {
  generateTableQRCode,
  validateTableQRCode
};
