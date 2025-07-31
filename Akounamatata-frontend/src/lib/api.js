import axios from 'axios';

// Configuration de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.171.193:5000/api';

// Instance Axios configurée
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('akounamatata_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      localStorage.removeItem('akounamatata_token');
      localStorage.removeItem('akounamatata_user');
      window.location.href = '/login';
    }
    
    // Retourner l'erreur formatée
    return Promise.reject({
      message: error.response?.data?.message || 'Une erreur est survenue',
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// Services d'authentification
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  
  register: (userData) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/me')
};

// Services des utilisateurs
export const userService = {
  getUsers: (params = {}) => api.get('/users', { params }),
  
  getUser: (id) => api.get(`/users/${id}`),
  
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  addFavorite: (userId, platId) => api.post(`/users/${userId}/add-favorite`, { platId }),
  
  removeFavorite: (userId, platId) => api.delete(`/users/${userId}/remove-favorite/${platId}`),
  
  getFavorites: (userId) => api.get(`/users/${userId}/favorites`)
};

// Services des tables
export const tableService = {
  getTables: (params = {}) => api.get('/table', { params }),
  
  getAvailableTables: () => api.get('/table/available'),
  
  getTable: (id) => api.get(`/table/${id}`),
  
  createTable: (tableData) => api.post('/table', tableData),
  
  updateTable: (id, tableData) => api.put(`/table/${id}`, tableData),
  
  deleteTable: (id) => api.delete(`/table/${id}`),
  
  getQRCode: (id) => api.get(`/table/${id}/qrcode`),
  
  occupyTable: (id) => api.post(`/table/${id}/occupy`),
  
  freeTable: (id) => api.post(`/table/${id}/free`),
  
  validateQR: (qrCode) => api.post('/table/validate-qr', { qrCode })
};

// Services des catégories
export const categorieService = {
  getCategories: (params = {}) => api.get('/categories', { params }),
  
  getCategorie: (id) => api.get(`/categories/${id}`),
  
  createCategorie: (categorieData) => api.post('/categories', categorieData),
  
  updateCategorie: (id, categorieData) => api.put(`/categories/${id}`, categorieData),
  
  deleteCategorie: (id) => api.delete(`/categories/${id}`),
  
  getCategoryPlats: (id, params = {}) => api.get(`/categories/${id}/plats`, { params })
};

// Services des plats
export const platService = {
  getPlats: (params = {}) => api.get('/plats', { params }),
  
  getFeaturedPlats: (params = {}) => api.get('/plats/featured', { params }),
  
  getPlat: (id) => api.get(`/plats/${id}`),
  
  createPlat: (platData) => api.post('/plats', platData),
  
  updatePlat: (id, platData) => api.put(`/plats/${id}`, platData),
  
  deletePlat: (id) => api.delete(`/plats/${id}`),
  
  toggleAvailability: (id) => api.patch(`/plats/${id}/toggle-availability`),
  
  getNutrition: (id) => api.get(`/plats/${id}/nutrition`)
};

// Services des menus
export const menuService = {
  getMenus: (params = {}) => api.get('/menus', { params }),
  
  getTodayMenu: (params = {}) => api.get('/menus/today', { params }),
  
  getMenu: (id) => api.get(`/menus/${id}`),
  
  createMenu: (menuData) => api.post('/menus', menuData),
  
  updateMenu: (id, menuData) => api.put(`/menus/${id}`, menuData),
  
  deleteMenu: (id) => api.delete(`/menus/${id}`),
  
  toggleStatus: (id) => api.patch(`/menus/${id}/toggle-status`),
  
  addPlat: (id, platId) => api.post(`/menus/${id}/add-plat`, { platId }),
  
  removePlat: (id, platId) => api.delete(`/menus/${id}/remove-plat/${platId}`)
};

// Services des paniers
export const panierService = {
  getPanier: (clientId, params={}) => api.get(`/paniers/${clientId}`, params),
  
  addToPanier: (clientId, itemData) => api.post(`/paniers/${clientId}/add`, itemData),
  
  updateItem: (clientId, itemData) => api.put(`/paniers/${clientId}/update-item`, itemData),
  
  removeItem: (clientId, platId, tableId) => api.delete(`/paniers/${clientId}/remove/${platId}/${tableId}`),
  
  clearPanier: (clientId, tableId) => api.delete(`/paniers/${clientId}/clear/${tableId}`),
  
  convertToOrder: (clientId, orderData) => api.post(`/paniers/${clientId}/convert-to-order`, orderData),
  
  getSummary: (clientId) => api.get(`/paniers/${clientId}/summary`)
};

// Services des commandes
export const commandeService = {
  getCommandes: (params = {}) => api.get('/commandes', { params }),
  
  getStats: (params = {}) => api.get('/commandes/stats', { params }),
  
  getUserCommande: (clientId, tableId) => api.get(`/commandes/${clientId}/${tableId}`),
  
  updateStatus: (id, statusData) => api.put(`/commandes/${id}/status`, statusData),
  
  getHistory: (clientId, params = {}) => api.get(`/commandes/client/${clientId}/history`, { params }),
  
  getTableCommandes: (tableId, params = {}) => api.get(`/commandes/table/${tableId}`, { params }),
  
  cancelCommande: (id) => api.delete(`/commandes/${id}`),
  
  getKitchenOrders: () => api.get('/commandes/pending/kitchen')
};