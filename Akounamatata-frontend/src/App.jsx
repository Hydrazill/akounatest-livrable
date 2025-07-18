import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/auth.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages publiques
import Login from './pages/Login';
import Register from './pages/Register';

// Pages client
import Home from './pages/Home';
import Menu from './pages/Menu';
import QRScanner from './pages/QRScanner';
import Panier from './pages/Panier';
import Favoris from './pages/Favoris';
import Historique from './pages/Historique';
import Profil from './pages/Profil';

// Pages admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminCommandes from './pages/admin/Commandes';
import AdminTables from './pages/admin/Tables';
import AdminMenus from './pages/admin/Menus';
import AdminPlats from './pages/admin/Plats';
import AdminUtilisateurs from './pages/admin/Utilisateurs';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Routes protégées avec layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Pages client */}
              <Route index element={<Home />} />
              <Route path="menu" element={<Menu />} />
              <Route path="scan" element={<QRScanner />} />
              <Route path="panier" element={<Panier />} />
              <Route path="favoris" element={<Favoris />} />
              <Route path="historique" element={<Historique />} />
              <Route path="profil" element={<Profil />} />
              
              {/* Pages admin */}
              <Route path="admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin/commandes" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCommandes />
                </ProtectedRoute>
              } />
              <Route path="admin/tables" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTables />
                </ProtectedRoute>
              } />
              <Route path="admin/menus" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminMenus />
                </ProtectedRoute>
              } />
              <Route path="admin/plats" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPlats />
                </ProtectedRoute>
              } />
              <Route path="admin/utilisateurs" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUtilisateurs />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

