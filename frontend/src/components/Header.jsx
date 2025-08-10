import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  User, 
  Heart,
  QrCode,
  History,
  LogOut,
  LogIn
} from 'lucide-react';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

import { useAuthStore, useUIStore, usePanierStore } from '@/lib/store';
import logo from '@/assets/logo_1.png'

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { isAuthenticated, user, logout } = useAuthStore();
  const { openCart } = useUIStore();
  const itemCount = usePanierStore((state) => state.itemCount);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    // <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
    <header className="sticky top-0 z-50 bg-foreground/50 backdrop-blur supports-[backdrop-filter]:bg-foreground/60">
      <div className="container mx-auto text-primary-foreground px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              className="flex items-center text-2xl font-bold foodHive-text-gradient"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* <span className="h-16 w-16 mr-2 rounded-full bg-gradient-to-br from-purple-400 to-orange-300 flex items-center justify-center"> */}
                <img
                  src={logo}
                  alt="FoodHive Logo"
                  className="h-24 w-24"
                />
              {/* </span> */}
              {/* FoodHive */}
            </motion.div>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/menu" 
              className="hover:text-primary transition-colors"
            >
              Menu
            </Link>
            {isAuthenticated && (
              <>
                <Link 
                  to="/favorites" 
                  className="hover:text-primary transition-colors"
                >
                  Favoris
                </Link>
                <Link 
                  to="/orders" 
                  className="hover:text-primary transition-colors"
                >
                  Historique
                </Link>
              </>
            )}
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Scan le code de la table */}
            <Link to="/qr" className="hover:text-primary transition-colors">
              <Button variant="ghost" size="sm" className="relative">
                <span className="sr-only">Scanner QR Code</span>
                <QrCode className="h-5 w-5" />
              </Button>
            </Link>
            {/* Panier */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* Menu utilisateur */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline">{user?.nom}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profil" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Mon Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      Mes Favoris
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="flex items-center">
                      <History className="mr-2 h-4 w-4" />
                      Historique
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Connexion
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">S'inscrire</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Menu mobile toggle */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Scan le code de la table */}
            <Link to="/qr" className="hover:text-primary transition-colors">
              <Button variant="ghost" size="sm">
                <span className="sr-only">Scanner QR Code</span>
                <QrCode className="h-5 w-5" />
              </Button>
            </Link>
            {/* Panier mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* Toggle menu mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border"
            >
              <nav className="py-4 space-y-2">
                <Link 
                  to="/menu" 
                  className="block px-4 py-2 hover:bg-accent rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Menu
                </Link>
                
                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 hover:bg-accent rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Mon Profil
                    </Link>
                    <Link 
                      to="/favorites" 
                      className="block px-4 py-2 hover:bg-accent rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Mes Favoris
                    </Link>
                    <Link 
                      to="/orders" 
                      className="block px-4 py-2 hover:bg-accent rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Historique
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md transition-colors"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="block px-4 py-2 hover:bg-accent rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link 
                      to="/register" 
                      className="block px-4 py-2 hover:bg-accent rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      S'inscrire
                    </Link>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;

