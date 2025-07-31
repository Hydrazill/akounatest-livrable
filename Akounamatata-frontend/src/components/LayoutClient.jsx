import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

import Header from './Header';
import Cart from './Cart';
import { useAuthStore, useUIStore, usePanierStore, useTableStore, useFavorisStore } from '@/lib/store';
import { panierService, userService } from '../lib/api';

const LayoutClient = () => {
  const isCartOpen = useUIStore((state) => state.isCartOpen);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if(user && user?.role !== 'client') {
    logout();
    navigate('/', { replace: true });
  }

  useEffect(() => {

    // console.log('user in Layout:', user.id);
    const fetchCart = async () => {
      if (user && user?.role === 'client') {
        try {
          let queryParams = {};
          const table = useTableStore.getState().table;
          if (table) {
            queryParams = { tableId: table._id };
          }
          
          const responseP = await panierService.getPanier(user.id, queryParams);
          if (responseP.success) {
            usePanierStore.getState().setPanier(responseP?.data?.panier);
          } else {
            console.error('Panier non chargé:', responseP);
            usePanierStore.getState().clearPanier();
          }
        } catch (err) {
          console.error('Erreur chargement panier:', err);
        }

        try {
          const responseF = await userService.getFavorites(user.id);
          if (responseF.success) {
            useFavorisStore.getState().setFavoris(responseF?.data?.favoris);
          } else {
            console.error('Favoris non chargés:', responseF);
            useFavorisStore.getState().clearFavoris();
          }
        } catch (err) {
          console.error('Erreur chargement favoris:', err);
        }
      } else {
        const table = useTableStore.getState().table;
        if(table) {
          try {
            const responseP = await panierService.getPanier(import.meta.env.VITE_USER, { tableId: table._id });
            if (responseP.success) {
              usePanierStore.getState().setPanier(responseP?.data?.panier);
            } else {
              console.error('Panier non chargé:', responseP);
              usePanierStore.getState().clearPanier();
            }
          } catch (err) {
            console.error('Erreur chargement panier:', err);
          }
        } else {
          usePanierStore.getState().clearPanier();
        }
      }
    };

    fetchCart();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Contenu principal */}
      <motion.main 
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.main>

      {/* Footer */}
      {/* <Footer /> */}

      {/* Panier coulissant */}
      {isCartOpen && <Cart />}
    </div>
  );
};

export default LayoutClient;
