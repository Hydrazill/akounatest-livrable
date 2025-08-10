import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Stores
import { useAuthStore } from './lib/store';

// Composants
import LayoutClient from '@/components/LayoutClient';
import AdminRoute from '@/components/AdminRoute';
import LayoutAdmin from '@/components/LayoutAdmin';
import ProtectedRoute from '@/components/ProtectedRoute';

// pages
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FavorisPage from './pages/FavorisPage';
import QRScannerPage from './pages/QRScannerPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminTablesPage from './pages/admin/AdminTablesPage';
import AdminCommandesPage from './pages/admin/AdminCommandesPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminPlatsPage from './pages/admin/AdminPlatsPage';
import AdminUtilisateursPage from './pages/admin/AdminUtilisateursPage';

// style
import './App.css'

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Initialiser l'authentification depuis le localStorage
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Routes publiques avec Layout client */}
              <Route path="/" element={<LayoutClient />}>
                <Route index element={<MenuPage />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="qr" element={<QRScannerPage />} />
                
                {/* Routes protégées pour les clients */}
                <Route path="profil" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="favorites" element={
                  <ProtectedRoute>
                    <FavorisPage />
                  </ProtectedRoute>
                } />
                <Route path="orders" element={
                  <ProtectedRoute>
                    <OrderHistoryPage />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Routes admin */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              
              {/* Routes admin protégées avec AdminLayout */}
              <Route path="/admin" element={
                <AdminRoute>
                  <LayoutAdmin />
                </AdminRoute>
              }>
                <Route index element={<AdminDashboardPage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="commandes" element={<AdminCommandesPage />} />
                <Route path="tables" element={<AdminTablesPage />} />
                <Route path="menus" element={<AdminMenuPage />} />
                <Route path="plats" element={<AdminPlatsPage />} />
                <Route path="utilisateurs" element={<AdminUtilisateursPage />} />
                <Route path="profil" element={<ProfilePage />} />
              </Route>

              {/* Route 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            {/* Notifications toast */}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--color-card)',
                  color: 'var(--color-card-foreground)',
                  border: '1px solid var(--color-border)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--foodHive-emerald)',
                    secondary: 'var(--foodHive-warm-white)',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'var(--destructive)',
                    secondary: 'var(--foodHive-warm-white)',
                  },
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </>
  )
}

export default App
