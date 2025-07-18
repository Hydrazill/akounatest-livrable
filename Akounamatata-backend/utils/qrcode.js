const QRCode = require('qrcode');

// Générer un QR code pour une table
const generateTableQRCode = async (tableId, tableNumber) => {
  try {
    const qrData = {
      type: 'table',
      tableId: tableId,
      tableNumber: tableNumber,
      timestamp: Date.now()
    };
    
    const qrString = JSON.stringify(qrData);
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
    
    return {
      qrCode: qrString,
      qrCodeImage: qrCodeDataURL
    };
  } catch (error) {
    throw new Error('Erreur lors de la génération du QR code: ' + error.message);
  }
};

// Valider un QR code de table
const validateTableQRCode = (qrCodeString) => {
  try {
    const qrData = JSON.parse(qrCodeString);
    
    if (qrData.type !== 'table' || !qrData.tableId || !qrData.tableNumber) {
      return { valid: false, message: 'QR code invalide' };
    }
    
    // Vérifier que le QR code n'est pas trop ancien (par exemple, 24 heures)
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
    const age = Date.now() - qrData.timestamp;
    
    if (age > maxAge) {
      return { valid: false, message: 'QR code expiré' };
    }
    
    return {
      valid: true,
      tableId: qrData.tableId,
      tableNumber: qrData.tableNumber
    };
  } catch (error) {
    return { valid: false, message: 'Format de QR code invalide' };
  }
};

module.exports = {
  generateTableQRCode,
  validateTableQRCode
};

