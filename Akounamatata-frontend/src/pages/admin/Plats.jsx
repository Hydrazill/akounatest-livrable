import { useState, useEffect } from 'react';
import { platService, categorieService } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Menu, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';

const Plats = () => {
  const [plats, setPlats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlat, setEditingPlat] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    categorieId: '',
    ingredients: '',
    allergenes: '',
    tempsPreparation: '',
    disponible: true,
    statActif: true,
    imageUrl: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les plats
      const platsResponse = await platService.getPlats({ limit: 100 });
      setPlats(platsResponse.plats || []);
      
      // Charger les catégories
      const categoriesResponse = await categorieService.getCategories();
      setCategories(categoriesResponse.categories || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
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
      
      await loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
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
      statActif: plat.statActif,
      imageUrl: plat.imageUrl || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (platId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) return;
    
    try {
      await platService.deletePlat(platId);
      await loadData();
      toast.success('Plat supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleAvailability = async (platId) => {
    try {
      await platService.toggleAvailability(platId);
      await loadData();
      toast.success('Disponibilité mise à jour');
    } catch (error) {
      console.error('Erreur lors du changement de disponibilité:', error);
      toast.error('Erreur lors du changement de disponibilité');
    }
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
      statActif: true,
      imageUrl: ''
    });
    setEditingPlat(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const filteredPlats = plats.filter(plat => {
    const matchesSearch = plat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plat.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || 
                           plat.categorieId?._id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Plats</h1>
          <p className="text-muted-foreground">
            {filteredPlats.length} plat{filteredPlats.length > 1 ? 's' : ''} trouvé{filteredPlats.length > 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-orange-600 hover:bg-orange-700">
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="statActif"
                    checked={formData.statActif}
                    onCheckedChange={(checked) => setFormData({...formData, statActif: checked})}
                  />
                  <Label htmlFor="statActif">Actif</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {editingPlat ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
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
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrer par catégorie" />
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
      </div>

      {/* Grille des plats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlats.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Menu className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun plat trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Aucun plat ne correspond à vos critères de recherche'
                : 'Commencez par ajouter des plats à votre menu'
              }
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un plat
            </Button>
          </div>
        ) : (
          filteredPlats.map((plat) => (
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
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={plat.disponible ? "default" : "secondary"}>
                      {plat.disponible ? "Disponible" : "Indisponible"}
                    </Badge>
                    {!plat.statActif && (
                      <Badge variant="destructive">Inactif</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">
                      {plat.prix} FCFA
                    </span>
                    {plat.tempsPreparation > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {plat.tempsPreparation} min
                      </span>
                    )}
                  </div>

                  {plat.categorieId && (
                    <Badge variant="outline" className="text-xs">
                      {plat.categorieId.nom}
                    </Badge>
                  )}

                  {plat.ingredients && plat.ingredients.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Ingrédients:</p>
                      <div className="flex flex-wrap gap-1">
                        {plat.ingredients.slice(0, 3).map((ingredient, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {ingredient}
                          </Badge>
                        ))}
                        {plat.ingredients.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{plat.ingredients.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {plat.allergenes && plat.allergenes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1 text-red-600">Allergènes:</p>
                      <div className="flex flex-wrap gap-1">
                        {plat.allergenes.map((allergene, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {allergene}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAvailability(plat._id)}
                    >
                      {plat.disponible ? (
                        <ToggleRight className="h-4 w-4 mr-2" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 mr-2" />
                      )}
                      {plat.disponible ? 'Disponible' : 'Indisponible'}
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plat)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(plat._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistiques */}
      {plats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{plats.length}</div>
              <div className="text-sm text-muted-foreground">Total plats</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {plats.filter(p => p.disponible).length}
              </div>
              <div className="text-sm text-muted-foreground">Disponibles</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(plats.reduce((sum, plat) => sum + plat.prix, 0) / plats.length) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Prix moyen</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {categories.length}
              </div>
              <div className="text-sm text-muted-foreground">Catégories</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Plats;

