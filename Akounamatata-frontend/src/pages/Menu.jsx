import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { platService, categorieService, panierService, userService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  UtensilsCrossed, 
  Search, 
  Heart, 
  ShoppingCart, 
  Plus,
  Minus,
  Clock,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const Menu = () => {
  const { user } = useAuth();
  const [plats, setPlats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('nom');
  const [favorites, setFavorites] = useState([]);
  const [selectedPlat, setSelectedPlat] = useState(null);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    loadData();
    loadFavorites();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les catégories
      const categoriesResponse = await categorieService.getCategories();
      setCategories(categoriesResponse.categories || []);
      
      // Charger les plats
      const platsResponse = await platService.getPlats({ 
        disponible: true,
        limit: 100 
      });
      setPlats(platsResponse.plats || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await userService.getFavorites(user.id);
      setFavorites(response.favoris || []);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  };

  const toggleFavorite = async (platId) => {
    try {
      const isFavorite = favorites.includes(platId);
      
      if (isFavorite) {
        await userService.removeFavorite(user.id, platId);
        setFavorites(favorites.filter(id => id !== platId));
        toast.success('Retiré des favoris');
      } else {
        await userService.addFavorite(user.id, platId);
        setFavorites([...favorites, platId]);
        toast.success('Ajouté aux favoris');
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
      toast.error('Erreur lors de la gestion des favoris');
    }
  };

  const addToCart = async (plat) => {
    try {
      // Vérifier qu'une table est sélectionnée
      const currentTable = localStorage.getItem('currentTable');
      if (!currentTable) {
        toast.error('Veuillez d\'abord scanner le QR code d\'une table');
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

  const updateQuantity = (platId, change) => {
    const currentQuantity = quantities[platId] || 1;
    const newQuantity = Math.max(1, currentQuantity + change);
    setQuantities({ ...quantities, [platId]: newQuantity });
  };

  const filteredPlats = plats.filter(plat => {
    const matchesSearch = plat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plat.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           plat.categorieId?._id === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'prix':
        return a.prix - b.prix;
      case 'nom':
        return a.nom.localeCompare(b.nom);
      default:
        return 0;
    }
  });

  const favoriteePlats = plats.filter(plat => favorites.includes(plat._id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const PlatCard = ({ plat }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
            onClick={() => toggleFavorite(plat._id)}
            className={favorites.includes(plat._id) ? 'text-red-500' : 'text-gray-400'}
          >
            <Heart className={`h-4 w-4 ${favorites.includes(plat._id) ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-orange-600">
              {plat.prix} FCFA
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedPlat(plat)}>
                  <Info className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {plat.categorieId && (
            <Badge variant="outline" className="text-xs">
              {plat.categorieId.nom}
            </Badge>
          )}

          {plat.tempsPreparation > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {plat.tempsPreparation} min
            </div>
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
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notre Menu</h1>
          <p className="text-muted-foreground">
            Découvrez nos délicieux plats préparés avec amour
          </p>
        </div>
        <UtensilsCrossed className="h-12 w-12 text-orange-600" />
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un plat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nom">Nom</SelectItem>
            <SelectItem value="prix">Prix</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Tous les plats ({filteredPlats.length})</TabsTrigger>
          <TabsTrigger value="favorites">Mes favoris ({favoriteePlats.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {filteredPlats.length === 0 ? (
            <div className="text-center py-12">
              <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun plat trouvé</h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlats.map((plat) => (
                <PlatCard key={plat._id} plat={plat} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites" className="space-y-4">
          {favoriteePlats.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun favori</h3>
              <p className="text-muted-foreground">
                Ajoutez des plats à vos favoris en cliquant sur le cœur
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteePlats.map((plat) => (
                <PlatCard key={plat._id} plat={plat} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog pour les détails du plat */}
      {selectedPlat && (
        <Dialog open={!!selectedPlat} onOpenChange={() => setSelectedPlat(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPlat.nom}</DialogTitle>
              <DialogDescription>
                Informations détaillées sur ce plat
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedPlat.imageUrl && (
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={selectedPlat.imageUrl} 
                    alt={selectedPlat.nom}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedPlat.description}</p>
              </div>

              {selectedPlat.ingredients && selectedPlat.ingredients.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Ingrédients</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlat.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="outline">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlat.allergenes && selectedPlat.allergenes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Allergènes</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlat.allergenes.map((allergene, index) => (
                      <Badge key={index} variant="destructive">
                        {allergene}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-2xl font-bold text-orange-600">
                  {selectedPlat.prix} FCFA
                </span>
                <Button 
                  onClick={() => {
                    addToCart(selectedPlat);
                    setSelectedPlat(null);
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ajouter au panier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Menu;

