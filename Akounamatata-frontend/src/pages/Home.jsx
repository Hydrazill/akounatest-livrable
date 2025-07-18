import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { platService, menuService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UtensilsCrossed, 
  QrCode, 
  Heart, 
  ShoppingCart, 
  Star,
  Clock,
  ChefHat
} from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const { user } = useAuth();
  const [featuredPlats, setFeaturedPlats] = useState([]);
  const [todayMenu, setTodayMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les plats en vedette
      const platsResponse = await platService.getFeaturedPlats({ limit: 6 });
      setFeaturedPlats(platsResponse.plats || []);
      
      // Charger le menu du jour
      try {
        const menuResponse = await menuService.getTodayMenu();
        setTodayMenu(menuResponse.menu);
      } catch (error) {
        // Pas de menu du jour disponible
        console.log('Aucun menu du jour disponible');
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">
            Bienvenue chez AKOUNAMATATA, {user?.nom}!
          </h1>
          <p className="text-xl mb-6 opacity-90">
            Découvrez nos délicieux plats et passez commande en toute simplicité
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
              <Link to="/scan">
                <QrCode className="mr-2 h-5 w-5" />
                Scanner une table
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-orange-600">
              <Link to="/menu">
                <UtensilsCrossed className="mr-2 h-5 w-5" />
                Voir le menu
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
          <ChefHat className="h-32 w-32" />
        </div>
      </div>

      {/* Menu du jour */}
      {todayMenu && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Menu du jour</h2>
            <Badge variant="secondary" className="text-sm">
              <Clock className="mr-1 h-3 w-3" />
              Aujourd'hui
            </Badge>
          </div>
          
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-600">{todayMenu.titre}</CardTitle>
              {todayMenu.description && (
                <CardDescription>{todayMenu.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayMenu.plats?.slice(0, 3).map((plat) => (
                  <div key={plat._id} className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50">
                    <div className="flex-1">
                      <h4 className="font-medium">{plat.nom}</h4>
                      <p className="text-sm text-muted-foreground">{plat.prix} FCFA</p>
                    </div>
                    {plat.disponible && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Disponible
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              {todayMenu.plats?.length > 3 && (
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link to="/menu">
                      Voir tous les plats ({todayMenu.plats.length})
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/scan">
            <CardHeader className="text-center">
              <QrCode className="h-12 w-12 mx-auto text-orange-600 mb-2" />
              <CardTitle>Scanner QR</CardTitle>
              <CardDescription>
                Scannez le code QR de votre table pour commencer
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/favoris">
            <CardHeader className="text-center">
              <Heart className="h-12 w-12 mx-auto text-red-500 mb-2" />
              <CardTitle>Mes Favoris</CardTitle>
              <CardDescription>
                Retrouvez vos plats préférés
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/panier">
            <CardHeader className="text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-green-600 mb-2" />
              <CardTitle>Mon Panier</CardTitle>
              <CardDescription>
                Consultez votre panier actuel
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Plats en vedette */}
      {featuredPlats.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Plats en vedette</h2>
            <Button asChild variant="outline">
              <Link to="/menu">Voir tout le menu</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPlats.map((plat) => (
              <Card key={plat._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {plat.imageUrl && (
                  <div className="aspect-video bg-gray-200">
                    <img 
                      src={plat.imageUrl} 
                      alt={plat.nom}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{plat.nom}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {plat.description}
                      </CardDescription>
                    </div>
                    <Badge variant={plat.disponible ? "default" : "secondary"}>
                      {plat.disponible ? "Disponible" : "Indisponible"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">
                      {plat.prix} FCFA
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" disabled={!plat.disponible}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                  {plat.categorieId && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {plat.categorieId.nom}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <UtensilsCrossed className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold">{featuredPlats.length}</div>
            <div className="text-sm text-muted-foreground">Plats disponibles</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">4.8</div>
            <div className="text-sm text-muted-foreground">Note moyenne</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold">15-30</div>
            <div className="text-sm text-muted-foreground">Min de préparation</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <ChefHat className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm text-muted-foreground">Fait maison</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;

