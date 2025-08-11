import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { panierService, tableService } from './api';

// Store principal pour l'authentification et l'utilisateur
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // État
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (user, token) => {
        localStorage.setItem('foodHive_token', token);
        localStorage.setItem('foodHive_user', JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        localStorage.removeItem('foodHive_token');
        localStorage.removeItem('foodHive_user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        usePanierStore.getState().clearPanier();
        useFavorisStore.getState().clearFavoris();
      },

      updateUser: (userData) => {
        const updatedUser = { ...get().user, ...userData };
        localStorage.setItem('foodHive_user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      // Vérifier si l'utilisateur est admin
      isAdmin: () => get().user?.role === 'admin',

      // Initialiser depuis le localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('foodHive_token');
        const userStr = localStorage.getItem('foodHive_user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
            });
          } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'auth:', error);
            get().logout();
          }
        }
      },
    }),
    {
      name: 'foodHive-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Store pour l'interface utilisateur
export const useUIStore = create((set) => ({
  // État
  isMobileMenuOpen: false,
  isCartOpen: false,
  currentModal: null,
  theme: 'light',

  // Actions
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),

  openModal: (modalType) => set({ currentModal: modalType }),
  closeModal: () => set({ currentModal: null }),

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));

// Store pour la gestion du panier
export const usePanierStore = create(
  persist(
    (set) => ({
      panier: {},
      itemCount: 0,

      setPanier: (panier) => {
        set({
          panier: panier,
          itemCount:panier.items.reduce((acc, item) => {
            return item.platId.disponible ? acc + item.quantite : acc;
          }, 0),
        });
      },

      clearPanier: () => {
        set({ panier: {}, itemCount: 0 });
      },
    }),
    {
      name: 'panier-storage',
      partialize: (state) => ({
        panier: state.panier,
        itemCount: state.itemCount,
      }),
    }
  )
);

// Store pour la gestion de la table
export const useTableStore = create(
  persist(
    (set) => ({
      table: null,
      qrData: {},

      setTable: (newTable) => set({ table: newTable }),

      setQrData: (newQr) => set({ qrData: newQr }),

      clearTable: () => set({ table: null }),
    }),
    {
      name: 'foodHive_table',
      getStorage: () => localStorage,
    }
  )
);

// Store pour la gestion des favoris
export const useFavorisStore = create(
  persist(
    (set) => ({
      favoris: [],

      setFavoris: (newFavoris) =>
        set(() => ({ favoris: [...newFavoris] })),

      addFavoris: (newFavoris) =>
        set((state) => ({ favoris: [...state.favoris, newFavoris] })),

      removeFavoris: (favorisToRemove) =>
        set((state) => ({ favoris: state.favoris.filter((item) => item !== favorisToRemove) })),

      clearFavoris: () => set({ favoris: [] }),
    }),
    {
      name: 'foodHive_favoris',
      getStorage: () => localStorage,
    }
  )
);

// Store pour la gestion de la commande
export const useCommandeStore = create(
  persist(
    (set) => ({
      commande: {},

      setPanier: (commande) => {
        set({
          commande: commande,
        });
      },

      clearCommande: () => {
        set({ panier: {} });
      },
    }),
    {
      name: 'commande-storage',
      partialize: (state) => ({
        commande: state.commande
      }),
    }
  )
);