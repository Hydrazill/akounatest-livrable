import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    motDePasse: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.motDePasse) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(formData.email, formData.motDePasse);
      
      if (result.success) {
        // Rediriger vers la page appropriée selon le rôle
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(from);
        }
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">AKOUNAMATATA</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte pour accéder au restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
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
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link 
                to="/register" 
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                S'inscrire
              </Link>
            </p>
          </div>

          {/* Comptes de démonstration */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Comptes de démonstration :</p>
            <div className="space-y-2 text-xs">
              <div>
                <strong>Admin :</strong> admin@akounamatata.com / admin123
              </div>
              <div>
                <strong>Client :</strong> client@akounamatata.com / client123
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

