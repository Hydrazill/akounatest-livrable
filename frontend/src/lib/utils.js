import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Utilitaires pour le formatage
export const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // Franc CFA
    minimumFractionDigits: 0,
  }).format(price);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Utilitaires pour les QR codes
export const parseQRCodeURL = (url) => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    return {
      type: params.get('type'),
      id: params.get('id'),
      number: params.get('number'),
      timestamp: params.get('timestamp'),
    };
  } catch (error) {
    console.error('Erreur lors du parsing de l\'URL QR:', error);
    return null;
  }
};

export const extractQRDataFromCurrentURL = () => {
  const params = new URLSearchParams(window.location.search);
  
  return {
    type: params.get('type'),
    id: params.get('id'),
    number: params.get('number'),
    timestamp: params.get('timestamp'),
  };
};

// Utilitaires pour la validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

// Utilitaires pour les statuts de commande
export const getStatusColor = (status) => {
  const statusColors = {
    'en_attente': 'bg-yellow-100 text-yellow-800',
    'confirmee': 'bg-blue-100 text-blue-800',
    'en_preparation': 'bg-orange-100 text-orange-800',
    'prete': 'bg-green-100 text-green-800',
    'servie': 'bg-emerald-100 text-emerald-800',
    'payee': 'bg-gray-100 text-gray-800',
    'annulee': 'bg-red-100 text-red-800',
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status) => {
  const statusLabels = {
    'en_attente': 'En attente',
    'confirmee': 'Confirmée',
    'en_preparation': 'En préparation',
    'prete': 'Prête',
    'servie': 'Servie',
    'payee': 'Payée',
    'annulee': 'Annulée',
  };
  
  return statusLabels[status] || status;
};

// Utilitaires pour le localStorage
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${key}:`, error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Erreur lors du nettoyage du localStorage:', error);
    }
  },
};

// Utilitaires pour les animations
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

export const slideInRight = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
  transition: { duration: 0.3 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 }
};

// Utilitaires pour les erreurs
export const handleApiError = (error) => {
  if (error.response) {
    // Erreur de réponse du serveur
    return error.response.data?.message || 'Une erreur est survenue';
  } else if (error.request) {
    // Erreur de réseau
    return 'Problème de connexion. Vérifiez votre réseau.';
  } else {
    // Autre erreur
    return error.message || 'Une erreur inattendue est survenue';
  }
};

// Utilitaires pour les notifications
export const showSuccess = (message) => {
  // Sera utilisé avec react-hot-toast
  console.log('Success:', message);
};

export const showError = (message) => {
  // Sera utilisé avec react-hot-toast
  console.error('Error:', message);
};

// Utilitaires pour les allergènes
export const getAllergeneIcon = (allergene) => {
  const icons = {
    'gluten': '🌾',
    'lactose': '🥛',
    'oeufs': '🥚',
    'poisson': '🐟',
    'crustaces': '🦐',
    'arachides': '🥜',
    'soja': '🌱',
    'fruits_a_coque': '🌰',
    'celeri': '🥬',
    'moutarde': '🌿',
    'sesame': '🌰',
    'sulfites': '🍷',
  };
  
  return icons[allergene] || '⚠️';
};

// Utilitaires pour la recherche et le filtrage
export const searchPlats = (plats, searchTerm) => {
  if (!searchTerm) return plats;
  
  const term = searchTerm.toLowerCase();
  return plats.filter(plat => 
    plat.nom.toLowerCase().includes(term) ||
    plat.description.toLowerCase().includes(term) ||
    plat.ingredients.some(ingredient => 
      ingredient.toLowerCase().includes(term)
    )
  );
};

export const filterPlatsByCategory = (plats, categoryId) => {
  if (!categoryId) return plats;
  return plats.filter(plat => plat.categorieId === categoryId);
};

export const sortPlats = (plats, sortBy = 'nom') => {
  return [...plats].sort((a, b) => {
    switch (sortBy) {
      case 'prix_asc':
        return a.prix - b.prix;
      case 'prix_desc':
        return b.prix - a.prix;
      case 'nom':
      default:
        return a.nom.localeCompare(b.nom);
    }
  });
};

