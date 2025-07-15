import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.215.193:5000/api';

// Configuration d'axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  login: async (email, motDePasse) => {
    const response = await api.post('/auth/login', { email, motDePasse });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Services des utilisateurs
export const userService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  
  addFavorite: async (userId, platId) => {
    const response = await api.post(`/users/${userId}/add-favorite`, { platId });
    return response.data;
  },
  
  removeFavorite: async (userId, platId) => {
    const response = await api.delete(`/users/${userId}/remove-favorite/${platId}`);
    return response.data;
  },
  
  getFavorites: async (userId) => {
    const response = await api.get(`/users/${userId}/favorites`);
    return response.data;
  }
};

// Services des tables
export const tableService = {
  getTables: async (params = {}) => {
    const response = await api.get('/tables', { params });
    return response.data;
  },
  
  getAvailableTables: async () => {
    const response = await api.get('/tables/available');
    return response.data;
  },
  
  getTable: async (id) => {
    const response = await api.get(`/tables/${id}`);
    return response.data;
  },
  
  createTable: async (tableData) => {
    const response = await api.post('/tables', tableData);
    return response.data;
  },
  
  updateTable: async (id, tableData) => {
    const response = await api.put(`/tables/${id}`, tableData);
    return response.data;
  },
  
  deleteTable: async (id) => {
    const response = await api.delete(`/tables/${id}`);
    return response.data;
  },
  
  getQRCode: async (id) => {
    const response = await api.get(`/tables/${id}/qrcode`);
    return response.data;
  },
  
  occupyTable: async (id) => {
    const response = await api.post(`/tables/${id}/occupy`);
    return response.data;
  },
  
  freeTable: async (id) => {
    const response = await api.post(`/tables/${id}/free`);
    return response.data;
  },
  
  validateQR: async (qrCode) => {
    const response = await api.post('/tables/validate-qr', { qrCode });
    return response.data;
  }
};

// Services des catégories
export const categorieService = {
  getCategories: async (params = {}) => {
    const response = await api.get('/categories', { params });
    return response.data;
  },
  
  getCategorie: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
  
  createCategorie: async (categorieData) => {
    const response = await api.post('/categories', categorieData);
    return response.data;
  },
  
  updateCategorie: async (id, categorieData) => {
    const response = await api.put(`/categories/${id}`, categorieData);
    return response.data;
  },
  
  deleteCategorie: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
  
  getCategoryPlats: async (id, params = {}) => {
    const response = await api.get(`/categories/${id}/plats`, { params });
    return response.data;
  }
};

// Services des plats
export const platService = {
  getPlats: async (params = {}) => {
    const response = await api.get('/plats', { params });
    return response.data;
  },
  
  getFeaturedPlats: async (params = {}) => {
    const response = await api.get('/plats/featured', { params });
    return response.data;
  },
  
  getPlat: async (id) => {
    const response = await api.get(`/plats/${id}`);
    return response.data;
  },
  
  createPlat: async (platData) => {
    const response = await api.post('/plats', platData);
    return response.data;
  },
  
  updatePlat: async (id, platData) => {
    const response = await api.put(`/plats/${id}`, platData);
    return response.data;
  },
  
  deletePlat: async (id) => {
    const response = await api.delete(`/plats/${id}`);
    return response.data;
  },
  
  toggleAvailability: async (id) => {
    const response = await api.patch(`/plats/${id}/toggle-availability`);
    return response.data;
  },
  
  getNutrition: async (id) => {
    const response = await api.get(`/plats/${id}/nutrition`);
    return response.data;
  }
};

// Services des menus
export const menuService = {
  getMenus: async (params = {}) => {
    const response = await api.get('/menus', { params });
    return response.data;
  },
  
  getTodayMenu: async (params = {}) => {
    const response = await api.get('/menus/today', { params });
    return response.data;
  },
  
  getMenu: async (id) => {
    const response = await api.get(`/menus/${id}`);
    return response.data;
  },
  
  createMenu: async (menuData) => {
    const response = await api.post('/menus', menuData);
    return response.data;
  },
  
  updateMenu: async (id, menuData) => {
    const response = await api.put(`/menus/${id}`, menuData);
    return response.data;
  },
  
  deleteMenu: async (id) => {
    const response = await api.delete(`/menus/${id}`);
    return response.data;
  },
  
  toggleStatus: async (id) => {
    const response = await api.patch(`/menus/${id}/toggle-status`);
    return response.data;
  },
  
  addPlat: async (id, platId) => {
    const response = await api.post(`/menus/${id}/add-plat`, { platId });
    return response.data;
  },
  
  removePlat: async (id, platId) => {
    const response = await api.delete(`/menus/${id}/remove-plat/${platId}`);
    return response.data;
  }
};

// Services des paniers
export const panierService = {
  getPanier: async (clientId) => {
    const response = await api.get(`/paniers/${clientId}`);
    return response.data;
  },
  
  addToPanier: async (clientId, itemData) => {
    const response = await api.post(`/paniers/${clientId}/add`, itemData);
    return response.data;
  },
  
  updateItem: async (clientId, itemData) => {
    const response = await api.put(`/paniers/${clientId}/update-item`, itemData);
    return response.data;
  },
  
  removeItem: async (clientId, platId) => {
    const response = await api.delete(`/paniers/${clientId}/remove/${platId}`);
    return response.data;
  },
  
  clearPanier: async (clientId) => {
    const response = await api.delete(`/paniers/${clientId}/clear`);
    return response.data;
  },
  
  convertToOrder: async (clientId, orderData) => {
    const response = await api.post(`/paniers/${clientId}/convert-to-order`, orderData);
    return response.data;
  },
  
  getSummary: async (clientId) => {
    const response = await api.get(`/paniers/${clientId}/summary`);
    return response.data;
  }
};

// Services des commandes
export const commandeService = {
  getCommandes: async (params = {}) => {
    const response = await api.get('/commandes', { params });
    return response.data;
  },
  
  getStats: async (params = {}) => {
    const response = await api.get('/commandes/stats', { params });
    return response.data;
  },
  
  getCommande: async (id) => {
    const response = await api.get(`/commandes/${id}`);
    return response.data;
  },
  
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/commandes/${id}/status`, statusData);
    return response.data;
  },
  
  getHistory: async (clientId, params = {}) => {
    const response = await api.get(`/commandes/client/${clientId}/history`, { params });
    return response.data;
  },
  
  getTableCommandes: async (tableId, params = {}) => {
    const response = await api.get(`/commandes/table/${tableId}`, { params });
    return response.data;
  },
  
  cancelCommande: async (id) => {
    const response = await api.delete(`/commandes/${id}`);
    return response.data;
  },
  
  getKitchenOrders: async () => {
    const response = await api.get('/commandes/pending/kitchen');
    return response.data;
  }
};

// Services admin
export const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  
  getOperations: async (params = {}) => {
    const response = await api.get('/admin/operations', { params });
    return response.data;
  },
  
  getAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analytics', { params });
    return response.data;
  },
  
  getUserStats: async () => {
    const response = await api.get('/admin/users/stats');
    return response.data;
  },
  
  sendNotification: async (notificationData) => {
    const response = await api.post('/admin/notifications', notificationData);
    return response.data;
  },
  
  exportCommandes: async (params = {}) => {
    const response = await api.get('/admin/export/commandes', { params });
    return response.data;
  }
};

export default api;

