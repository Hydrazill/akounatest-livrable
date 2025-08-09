import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { authService, panierService } from '@/lib/api';
import { useAuthStore, usePanierStore, useTableStore } from '@/lib/store';
import { validateEmail } from '@/lib/utils';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    motDePasse: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const from = location.state?.from?.pathname || '/menu';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.motDePasse) {
      newErrors.motDePasse = 'Le mot de passe est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const response = await authService.login(formData);
      
      if (response.success && response.data.user.role === 'client') {
        login(response.data.user, response.data.token);

        // chargement et stockage du panier
        try {
          let queryParams = {};
          const table = useTableStore.getState().table;
          if (table) {
            queryParams = { tableId: table._id };
          }
          
          const responseP = await panierService.getPanier(useAuthStore.getState().user.id, queryParams);
          if (responseP.success) {
            usePanierStore.getState().setPanier(responseP?.data?.panier);
          } else {
            console.error('Panier non chargé:', responseP);
            usePanierStore.getState().clearPanier();
          }
        } catch (err) {
          console.error('Erreur chargement panier:', err);
        }

        toast.success('Connexion réussie !');
        navigate('/', { replace: true });
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="foodHive-card">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className="text-2xl font-bold foodHive-text-gradient">
                Connexion
              </CardTitle>
              <CardDescription>
                Connectez-vous à votre compte FoodHive
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="motDePasse">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="motDePasse"
                    name="motDePasse"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={formData.motDePasse}
                    onChange={handleChange}
                    className={errors.motDePasse ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.motDePasse && (
                  <p className="text-sm text-destructive">{errors.motDePasse}</p>
                )}
              </div>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                className="w-full foodHive-button-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Connexion...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </div>
                )}
              </Button>
            </form>

            {/* Liens */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:underline font-medium"
                >
                  S'inscrire
                </Link>
              </p>
              
              <Link 
                to="/menu" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Continuer sans compte
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;

