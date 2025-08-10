import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService, platService } from '../../lib/api';
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
  UtensilsCrossed, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  Eye,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const AdminMenuPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [selectedPlats, setSelectedPlats] = useState([]);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date: '',
    versionWeb: true
  });

  const queryClient = useQueryClient();

   // Récupérer les catégories
  const { data: menusData } = useQuery({
    queryKey: ['admin-menus'],
    queryFn: menuService.getMenus,
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  // Récupérer les plats
  const { data: platsData, isLoading } = useQuery({
    queryKey: ['admin-plats'],
    queryFn: platService.getPlats,
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  const menus = menusData?.data?.menus || [];
  const plats = platsData?.data?.plats || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const menuData = {
        ...formData,
        plats: selectedPlats
      };

      if (editingMenu) {
        await menuService.updateMenu(editingMenu._id, menuData);
        toast.success('Menu mis à jour');
      } else {
        await menuService.createMenu(menuData);
        toast.success('Menu créé');
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      titre: menu.titre,
      description: menu.description || '',
      date: menu.date ? format(new Date(menu.date), 'yyyy-MM-dd') : '',
      versionWeb: menu.versionWeb
    });
    setSelectedPlats(menu.plats?.map(p => p._id) || []);
    setIsDialogOpen(true);
  };

  const handleDelete = async (menuId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce menu ?')) return;
    
    try {
      await menuService.deleteMenu(menuId);
      toast.success('Menu supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleMenuStatus = async (menuId) => {
    try {
      await menuService.toggleStatus(menuId);
      toast.success('Statut du menu mis à jour');
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const addPlatToMenu = async (menuId, platId) => {
    try {
      await menuService.addPlat(menuId, platId);
      toast.success('Plat ajouté au menu');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du plat:', error);
      toast.error('Erreur lors de l\'ajout du plat');
    }
  };

  const removePlatFromMenu = async (menuId, platId) => {
    try {
      await menuService.removePlat(menuId, platId);
      toast.success('Plat retiré du menu');
    } catch (error) {
      console.error('Erreur lors de la suppression du plat:', error);
      toast.error('Erreur lors de la suppression du plat');
    }
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      date: '',
      versionWeb: true
    });
    setSelectedPlats([]);
    setEditingMenu(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePlatSelection = (platId) => {
    setSelectedPlats(prev => 
      prev.includes(platId) 
        ? prev.filter(id => id !== platId)
        : [...prev, platId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold foodHive-text-gradient">Gestion des Menus</h1>
          <p className="text-muted-foreground">
            {menus.length} menu{menus.length > 1 ? 's' : ''} configuré{menus.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button
            onClick={() => queryClient.invalidateQueries(['admin-tables'])}
            variant="outline"
            className="text-primary-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="foodHive-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMenu ? 'Modifier le menu' : 'Nouveau menu'}
              </DialogTitle>
              <DialogDescription className="text-foreground">
                {editingMenu ? 'Modifiez les informations du menu' : 'Créez un nouveau menu pour le restaurant'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre du menu</Label>
                <Input
                  id="titre"
                  name="titre"
                  type="text"
                  value={formData.titre}
                  onChange={handleChange}
                  placeholder="Ex: Menu du jour"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description du menu..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date du menu</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="versionWeb"
                  checked={formData.versionWeb}
                  onCheckedChange={(checked) => setFormData({...formData, versionWeb: checked})}
                />
                <Label htmlFor="versionWeb">Disponible sur le web</Label>
              </div>

              <div className="space-y-2">
                <Label>Plats du menu</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {plats.map((plat) => (
                    <div key={plat._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`plat-${plat._id}`}
                        checked={selectedPlats.includes(plat._id)}
                        onChange={() => handlePlatSelection(plat._id)}
                        className="rounded"
                      />
                      <label htmlFor={`plat-${plat._id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span>{plat.nom}</span>
                          <span className="text-sm text-muted-foreground">{plat.prix} FCFA</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-foreground">
                  {selectedPlats.length} plat{selectedPlats.length > 1 ? 's' : ''} sélectionné{selectedPlats.length > 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex justify-end space-x-2 text-primary-foreground">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {editingMenu ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des menus */}
      <div className="space-y-4">
        {menus.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun menu configuré</h3>
            <p className="text-foreground mb-4">
              Commencez par créer des menus pour votre restaurant
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Créer un menu
            </Button>
          </div>
        ) : (
          menus.map((menu) => (
            <Card key={menu._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{menu.titre}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center space-x-4">
                        {menu.date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(menu.date), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        )}
                        <span className="flex items-center">
                          <UtensilsCrossed className="h-4 w-4 mr-1" />
                          {menu.plats?.length || 0} plats
                        </span>
                        {menu.dateCreation && (
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Créé le {format(new Date(menu.dateCreation), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={menu.versionWeb ? "default" : "secondary"}>
                      {menu.versionWeb ? "Web" : "Hors ligne"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMenuStatus(menu._id)}
                    >
                      {menu.statutActif ? (
                        <ToggleRight className="h-4 w-4" color='white' />
                      ) : (
                        <ToggleLeft className="h-4 w-4" color='white' />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {menu.description && (
                    <p className="text-foreground">{menu.description}</p>
                  )}

                  {/* Aperçu des plats */}
                  {menu.plats && menu.plats.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Plats inclus:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {menu.plats.slice(0, 6).map((plat) => (
                          <div key={plat._id} className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-sm">{plat.nom}</span>
                            <span className="text-sm font-medium text-orange-600">{plat.prix} FCFA</span>
                          </div>
                        ))}
                      </div>
                      {menu.plats.length > 6 && (
                        <p className="text-sm text-muted-foreground">
                          ... et {menu.plats.length - 6} autre{menu.plats.length - 6 > 1 ? 's' : ''} plat{menu.plats.length - 6 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-foreground">
                      Total: {menu.plats?.reduce((sum, plat) => sum + plat.prix, 0) || 0} FCFA
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(menu)}
                        className="text-primary-foreground"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(menu._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
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
      {menus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{menus.length}</div>
              <div className="text-sm text-foreground">Total menus</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {menus.filter(m => m.versionWeb).length}
              </div>
              <div className="text-sm text-foreground">Menus actifs</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {menus.reduce((sum, menu) => sum + (menu.plats?.length || 0), 0)}
              </div>
              <div className="text-sm text-foreground">Total plats</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(menus.reduce((sum, menu) => sum + (menu.plats?.reduce((s, p) => s + p.prix, 0) || 0), 0) / menus.length) || 0}
              </div>
              <div className="text-sm text-foreground">Prix moyen</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminMenuPage;

