// Fonction pour nettoyer et formater les données
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/\s+/g, ' ');
};

// Fonction pour formater les dates
const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// Fonction pour générer un ID unique simple
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Fonction pour valider les emails
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction pour masquer les emails dans les logs
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = localPart.length > 2 
    ? localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1)
    : localPart;
  
  return `${maskedLocal}@${domain}`;
};

// Fonction pour créer une réponse API standardisée
const createResponse = (success, data = null, message = null, error = null) => {
  const response = { success };
  
  if (data !== null) response.data = data;
  if (message !== null) response.message = message;
  if (error !== null) response.error = error;
  
  return response;
};


module.exports = {
  sanitizeInput,
  formatDate,
  generateId,
  isValidEmail,
  maskEmail,
  createResponse
};