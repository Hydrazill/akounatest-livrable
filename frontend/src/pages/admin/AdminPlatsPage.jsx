import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  UtensilsCrossed,
  Tag,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

import { platService, categorieService } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const AdminPlatsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingPlat, setEditingPlat] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    categorieId: '',
    ingredients: '',
    allergenes: '',
    tempsPreparation: '',
    disponible: true,
    imageUrl: ''
  });
  
  const queryClient = useQueryClient();

  // Récupérer les catégories
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categorieService.getCategories,
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  // Récupérer les plats
  const { data: platsData, isLoading } = useQuery({
    queryKey: ['admin-plats'],
    queryFn: platService.getPlats,
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  const categories = categoriesData?.data?.categories || [];
  const plats = platsData?.data?.plats || [];

  // Mutation pour changer la disponibilité d'un plat
  const toggleDisponibiliteMutation = useMutation({
    mutationFn: ({ id, disponible }) => platService.updatePlat(id, { disponible }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-plats']);
      toast.success('Disponibilité mise à jour');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });

  // Mutation pour supprimer un plat
  const deletePlatMutation = useMutation({
    mutationFn: platService.deletePlat,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-plats']);
      toast.success('Plat supprimé');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  // Filtrer les plats
  const filteredPlats = plats.filter(plat => {
    const matchesSearch = 
      plat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plat.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || plat.categorieId._id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleToggleDisponibilite = (platId, currentDisponibilite) => {
    toggleDisponibiliteMutation.mutate({ 
      id: platId, 
      disponible: !currentDisponibilite 
    });
  };

  const handleDeletePlat = (platId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      deletePlatMutation.mutate(platId);
    }
  };

  const handleEdit = (plat) => {
    setEditingPlat(plat);
    setFormData({
      nom: plat.nom,
      description: plat.description || '',
      prix: plat.prix.toString(),
      categorieId: plat.categorieId?._id || '',
      ingredients: plat.ingredients?.join(', ') || '',
      allergenes: plat.allergenes?.join(', ') || '',
      tempsPreparation: plat.tempsPreparation?.toString() || '',
      disponible: plat.disponible,
      imageUrl: plat.imageUrl || ''
    });
    setIsDialogOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const platData = {
        ...formData,
        prix: parseFloat(formData.prix),
        tempsPreparation: parseInt(formData.tempsPreparation) || 0,
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
        allergenes: formData.allergenes.split(',').map(a => a.trim()).filter(a => a)
      };

      if (editingPlat) {
        await platService.updatePlat(editingPlat._id, platData);
        toast.success('Plat mis à jour');
      } else {
        await platService.createPlat(platData);
        toast.success('Plat créé');
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c._id === categoryId._id);
    return category?.nom || 'Sans catégorie';
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prix: '',
      categorieId: '',
      ingredients: '',
      allergenes: '',
      tempsPreparation: '',
      disponible: true,
      imageUrl: ''
    });
    setEditingPlat(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-4" />
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold foodHive-text-gradient">
            Gestion des Plats
          </h1>
          <p className="text-muted-foreground">
            Gérez vos plats et catégories
          </p>
        </div>
        
        <div>
          <Button
            onClick={() => queryClient.invalidateQueries(['admin-tables'])}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" disabled>
            <Tag className="h-4 w-4 mr-2" />
            Catégories
          </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="foodHive-button-primary" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau plat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlat ? 'Modifier le plat' : 'Nouveau plat'}
              </DialogTitle>
              <DialogDescription>
                {editingPlat ? 'Modifiez les informations du plat' : 'Ajoutez un nouveau plat au menu'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du plat</Label>
                  <Input
                    id="nom"
                    name="nom"
                    type="text"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Ex: Poulet DG"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prix">Prix (FCFA)</Label>
                  <Input
                    id="prix"
                    name="prix"
                    type="number"
                    value={formData.prix}
                    onChange={handleChange}
                    placeholder="Ex: 2500"
                    min="0"
                    step="100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description du plat..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categorieId">Catégorie</Label>
                  <Select value={formData.categorieId} onValueChange={(value) => setFormData({...formData, categorieId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempsPreparation">Temps de préparation (min)</Label>
                  <Input
                    id="tempsPreparation"
                    name="tempsPreparation"
                    type="number"
                    value={formData.tempsPreparation}
                    onChange={handleChange}
                    placeholder="Ex: 15"
                    min="0"
                    max="120"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingrédients (séparés par des virgules)</Label>
                <Textarea
                  id="ingredients"
                  name="ingredients"
                  value={formData.ingredients}
                  onChange={handleChange}
                  placeholder="Ex: Poulet, Plantain, Légumes, Épices"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergenes">Allergènes (séparés par des virgules)</Label>
                <Input
                  id="allergenes"
                  name="allergenes"
                  type="text"
                  value={formData.allergenes}
                  onChange={handleChange}
                  placeholder="Ex: Gluten, Arachides"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL de l'image</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="disponible"
                    checked={formData.disponible}
                    onCheckedChange={(checked) => setFormData({...formData, disponible: checked})}
                  />
                  <Label htmlFor="disponible">Disponible</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {editingPlat ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un plat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Onglets par catégorie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="all">Tous</TabsTrigger>
            {categories.slice(0, 5).map((category) => (
              <TabsTrigger key={category._id} value={category._id}>
                {category.nom}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {/* Grille des plats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlats.map((plat) => (
                <Card key={plat._id} className="foodHive-card group">
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={plat.imageUrl}
                      alt={plat.nom}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Badge disponibilité */}
                    <Badge 
                      variant={plat.disponible ? "default" : "destructive"}
                      className="absolute top-2 left-2"
                    >
                      {plat.disponible ? 'Disponible' : 'Indisponible'}
                    </Badge>

                    {/* Actions rapides */}
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(plat)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeletePlat(plat._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* En-tête */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{plat.nom}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getCategoryName(plat.categorieId)}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(plat.prix)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {plat.description}
                    </p>

                    {/* Allergènes */}
                    {plat.allergenes && plat.allergenes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {plat.allergenes.slice(0, plat.allergenes.length).map((allergene, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {allergene}
                          </Badge>
                        ))}
                        {plat.allergenes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{plat.allergenes.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Contrôles */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={plat.disponible}
                          onCheckedChange={() => handleToggleDisponibilite(plat._id, plat.disponible)}
                        />
                        <span className="text-sm">
                          {plat.disponible ? 'Disponible' : 'Indisponible'}
                        </span>
                      </div>

                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(plat)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeletePlat(plat._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Carte d'ajout */}
              <Card className="foodHive-card border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setIsDialogOpen(true)}>
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-muted-foreground">Ajouter une table</h3>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Créez une nouvelle table pour votre restaurant
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Message si aucun plat */}
            {filteredPlats.length === 0 && (
              <div className="text-center py-12">
                <UtensilsCrossed className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun plat trouvé</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? 'Aucun plat ne correspond à votre recherche'
                    : 'Commencez par ajouter des plats à votre menu'
                  }
                </p>
                <Button className="foodHive-button-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un plat
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AdminPlatsPage;

