import { useState, useEffect } from 'react';
import { tableService } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  TableProperties, 
  Plus, 
  Edit, 
  Trash2, 
  QrCode,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    capacite: '',
    restaurantId: '',
    qrCode: ''
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await tableService.getTables();
      setTables(response.tables || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tables:', error);
      toast.error('Erreur lors du chargement des tables');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTable) {
        await tableService.updateTable(editingTable._id, formData);
        toast.success('Table mise à jour');
      } else {
        await tableService.createTable(formData);
        toast.success('Table créée');
      }
      
      await loadTables();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      numero: table.numero,
      capacite: table.capacite,
      restaurantId: table.restaurantId,
      qrCode: table.qrCode
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tableId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) return;
    
    try {
      await tableService.deleteTable(tableId);
      await loadTables();
      toast.success('Table supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleTableStatus = async (tableId) => {
    try {
      const table = tables.find(t => t._id === tableId);
      if (table.statutOccupe) {
        await tableService.freeTable(tableId);
        toast.success('Table libérée');
      } else {
        await tableService.occupyTable(tableId);
        toast.success('Table occupée');
      }
      await loadTables();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const generateQRCode = async (tableId) => {
    try {
      const response = await tableService.getQRCode(tableId);
      // Ici on pourrait afficher le QR code ou le télécharger
      toast.success('QR Code généré');
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      toast.error('Erreur lors de la génération du QR code');
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      capacite: '',
      restaurantId: '',
      qrCode: ''
    });
    setEditingTable(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
          <h1 className="text-3xl font-bold">Gestion des Tables</h1>
          <p className="text-muted-foreground">
            {tables.length} table{tables.length > 1 ? 's' : ''} configurée{tables.length > 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTable ? 'Modifier la table' : 'Nouvelle table'}
              </DialogTitle>
              <DialogDescription>
                {editingTable ? 'Modifiez les informations de la table' : 'Ajoutez une nouvelle table au restaurant'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Numéro de table</Label>
                <Input
                  id="numero"
                  name="numero"
                  type="text"
                  value={formData.numero}
                  onChange={handleChange}
                  placeholder="Ex: T001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacite">Capacité (nombre de personnes)</Label>
                <Input
                  id="capacite"
                  name="capacite"
                  type="number"
                  value={formData.capacite}
                  onChange={handleChange}
                  placeholder="Ex: 4"
                  min="1"
                  max="20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurantId">ID Restaurant</Label>
                <Input
                  id="restaurantId"
                  name="restaurantId"
                  type="text"
                  value={formData.restaurantId}
                  onChange={handleChange}
                  placeholder="ID du restaurant"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {editingTable ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grille des tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <Card key={table._id} className={`hover:shadow-lg transition-shadow ${
            table.statutOccupe ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Table {table.numero}</CardTitle>
                <Badge variant={table.statutOccupe ? "destructive" : "default"}>
                  {table.statutOccupe ? (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Occupée
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Libre
                    </>
                  )}
                </Badge>
              </div>
              <CardDescription>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Capacité: {table.capacite} personnes
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {table.dateOccupation && (
                  <div className="text-sm text-muted-foreground">
                    Occupée depuis: {new Date(table.dateOccupation).toLocaleString()}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTableStatus(table._id)}
                  >
                    {table.statutOccupe ? 'Libérer' : 'Occuper'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateQRCode(table._id)}
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    QR
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(table)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(table._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {table.qrCode && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    QR: {table.qrCode.substring(0, 20)}...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <TableProperties className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune table configurée</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par ajouter des tables à votre restaurant
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une table
          </Button>
        </div>
      )}

      {/* Statistiques */}
      {tables.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{tables.length}</div>
              <div className="text-sm text-muted-foreground">Total tables</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {tables.filter(t => !t.statutOccupe).length}
              </div>
              <div className="text-sm text-muted-foreground">Tables libres</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {tables.filter(t => t.statutOccupe).length}
              </div>
              <div className="text-sm text-muted-foreground">Tables occupées</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tables.reduce((sum, table) => sum + table.capacite, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Capacité totale</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Tables;

