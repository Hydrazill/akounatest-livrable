import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { userService, panierService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ShoppingCart, 
  Plus, 
  Minus, 
  UtensilsCrossed,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const Favoris = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favoris, setFavoris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    loadFavoris();
  }, []);

  const loadFavoris = async () => {
    try {
      setLoading(true);
      const response = await userService.getFavorites(user.id);
      setFavoris(response.favoris || []);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      toast.error('Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (platId) => {
    try {
      await userService.removeFavorite(user.id, platId);
      setFavoris(favoris.filter(plat => plat._id !== platId));
      toast.success('Retiré des favoris');
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      toast.error('Erreur lors de la suppression du favori');
    }
  };

  const updateQuantity = (platId, change) => {
    const currentQuantity = quantities[platId] || 1;
    const newQuantity = Math.max(1, currentQuantity + change);
    setQuantities({ ...quantities, [platId]: newQuantity });
  };

  const addToCart = async (plat) => {
    try {
      // Vérifier qu'une table est sélectionnée
      const currentTable = localStorage.getItem('currentTable');
      if (!currentTable) {
        toast.error('Veuillez d\'abord scanner le QR code d\'une table');
        navigate('/scan');
        return;
      }

      const table = JSON.parse(currentTable);
      const quantity = quantities[plat._id] || 1;

      // Simuler un QR code pour l'API
      const qrCode = JSON.stringify({
        type: 'table',
        tableId: table.id,
        tableNumber: table.numero,
        timestamp: Date.now()
      });

      await panierService.addToPanier(user.id, {
        platId: plat._id,
        quantite: quantity,
        qrCode: qrCode
      });

      toast.success(`${plat.nom} ajouté au panier`);
      
      // Réinitialiser la quantité
      setQuantities({ ...quantities, [plat._id]: 1 });
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      const message = error.response?.data?.message || 'Erreur lors de l\'ajout au panier';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (favoris.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold mb-4">Aucun favori</h2>
        <p className="text-muted-foreground mb-6">
          Vous n'avez pas encore ajouté de plats à vos favoris. 
          Explorez notre menu et ajoutez vos plats préférés en cliquant sur le cœur.
        </p>
        <Button onClick={() => navigate('/menu')} className="bg-orange-600 hover:bg-orange-700">
          <UtensilsCrossed className="mr-2 h-4 w-4" />
          Découvrir le menu
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Favoris</h1>
          <p className="text-muted-foreground">
            {favoris.length} plat{favoris.length > 1 ? 's' : ''} dans vos favoris
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/menu')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au menu
          </Button>
          <Button onClick={() => navigate('/panier')} className="bg-orange-600 hover:bg-orange-700">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Voir le panier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoris.map((plat) => (
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFavorite(plat._id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-600">
                    {plat.prix} FCFA
                  </span>
                  <Badge variant={plat.disponible ? "default" : "secondary"}>
                    {plat.disponible ? "Disponible" : "Indisponible"}
                  </Badge>
                </div>

                {plat.categorieId && (
                  <Badge variant="outline" className="text-xs">
                    {plat.categorieId.nom}
                  </Badge>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(plat._id, -1)}
                      disabled={!quantities[plat._id] || quantities[plat._id] <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{quantities[plat._id] || 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(plat._id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={() => addToCart(plat)}
                    disabled={!plat.disponible}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informations sur la table */}
      {(() => {
        const currentTable = localStorage.getItem('currentTable');
        if (!currentTable) {
          return (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="text-center text-yellow-800">
                  <h3 className="font-medium mb-2">Aucune table sélectionnée</h3>
                  <p className="text-sm mb-4">
                    Pour ajouter des plats au panier, vous devez d'abord scanner le QR code d'une table
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/scan')}
                    className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
                  >
                    Scanner une table
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }
        
        const table = JSON.parse(currentTable);
        return (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="text-center text-green-800">
                <h3 className="font-medium mb-2">Table sélectionnée</h3>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  Table {table.numero}
                </div>
                <div className="text-sm">
                  Capacité: {table.capacite} personnes
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
};

export default Favoris;

