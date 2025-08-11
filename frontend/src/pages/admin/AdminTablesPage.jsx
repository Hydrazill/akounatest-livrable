import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, 
  QrCode, 
  Users, 
  MapPin, 
  Edit, 
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

import { tableService } from '@/lib/api';

const AdminTablesPage = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    capacite: '',
    restaurantId: '',
    qrCode: ''
  });
  
  const queryClient = useQueryClient();

  // Récupérer les tables
  const { data: tablesData, isLoading } = useQuery({
    queryKey: ['admin-tables'],
    queryFn: tableService.getTables,
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  const tables = tablesData?.data?.tables || [];

  // Mutation pour libérer une table
  const freeTableMutation = useMutation({
    mutationFn: tableService.freeTable,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tables']);
      toast.success('Table libérée');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la libération');
    },
  });

  // Mutation pour supprimer une table
  const deleteTableMutation = useMutation({
    mutationFn: tableService.deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tables']);
      toast.success('Table supprimée');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  // Mutation pour générer un QR code
  const generateQRMutation = useMutation({
    mutationFn: tableService.getQRCode,
    onSuccess: (data) => {
      setQRCodeData(data.data);
      setShowQRCode(true);
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la génération du QR code');
    },
  });

  const handleFreeTable = (tableId) => {
    if (window.confirm('Êtes-vous sûr de vouloir libérer cette table ?')) {
      freeTableMutation.mutate(tableId);
    }
  };

  const handleDelete = (tableId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) {
      deleteTableMutation.mutate(tableId);
    }
  };

  const handleGenerateQR = (tableId) => {
    generateQRMutation.mutate(tableId);
  };

  const downloadQRCode = () => {
    if (qrCodeData?.qrCodeImage) {
      const link = document.createElement('a');
      link.href = qrCodeData.qrCodeImage;
      link.download = `table-${selectedTable?.numero}-qr.png`;
      link.click();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTable) {
        await tableService.updateTable(editingTable._id, formData);
        toast.success('Table mise à jour');
      } else {
        const response = await tableService.createTable(formData);
        toast.success('Table créée');
        
        // Si un QR code a été généré, l'afficher
        if (response.table && response.table.qrCode) {
          setSelectedQRCode({
            tableNumber: response.table.numero,
            qrCodeData: response.table.qrCode,
            qrCodeImage: response.qrCodeImage // Si l'API retourne l'image
          });
          setQrDialogOpen(true);
        }
      }
      
      setIsDialogOpen(false);
      setEditingTable(null);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
      toast.error(error.message);
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

  // Statistiques
  const stats = {
    total: tables.length,
    occupees: tables.filter(t => t.statutOccupee).length,
    libres: tables.filter(t => !t.statutOccupee).length,
    capaciteTotal: tables.reduce((sum, t) => sum + (t.capacite || 0), 0),
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold foodHive-text-gradient">
            Gestion des Tables
          </h1>
          <p className="text-primary-foreground">
            Gérez vos tables et générez les QR codes
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
          <Button className="foodHive-button-primary" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle table
          </Button>
        </div>
      </motion.div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card className="foodHive-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="foodHive-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground">Occupées</p>
                <p className="text-2xl font-bold">{stats.occupees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="foodHive-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground">Libres</p>
                <p className="text-2xl font-bold">{stats.libres}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="foodHive-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground">Capacité</p>
                <p className="text-2xl font-bold">{stats.capaciteTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grille des tables */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {tables.map((table) => (
          <Card 
            key={table._id} 
            className={`foodHive-card cursor-pointer transition-all duration-200 ${
              table.statutOccupee 
                ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                : 'border-green-200 bg-green-50 hover:bg-green-100'
            }`}
            onClick={() => setSelectedTable(table)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
                    ${table.statutOccupee ? 'bg-red-500' : 'bg-green-500'}
                  `}>
                    {table.numero}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">Table {table.numero}</h3>
                    <p className="text-sm text-foreground">
                      {table.capacite} places
                    </p>
                  </div>
                </div>
                
                <Badge 
                  variant={table.statutOccupee ? "destructive" : "default"}
                  className={table.statutOccupee ? "bg-red-500" : "bg-green-500"}
                >
                  {table.statutOccupee ? 'Occupée' : 'Libre'}
                </Badge>
              </div>

              {/* Client actuel */}
              {table.statutOccupee && table.clientActuel && (
                <div className="mb-4 p-2 bg-white/50 rounded">
                  <p className="text-xs text-foreground">Client actuel:</p>
                  <p className="text-sm font-medium">{table?.clientActuel?.nom}</p>
                </div>
              )}

              <div className="ml-3 mb-3">
                <h3 className="font-semibold">Restaurant : </h3>
                <span className="text-sm text-foreground">
                  {table.restaurantId}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateQR(table._id);
                    setSelectedTable(table);
                  }}
                  className="flex-1 text-primary-foreground"
                >
                  <QrCode className="h-3 w-3 mr-1" />
                  QR
                </Button>
                
                {table.statutOccupee ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFreeTable(table._id);
                    }}
                    className="flex-1 bg-green-500 text-primary-foreground hover:bg-green-600 text-white"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Libérer
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTable(table);
                      setFormData({
                        numero: table.numero,
                        capacite: table.capacite,
                        restaurantId: table.restaurantId,
                        qrCode: ''
                      })
                      setIsDialogOpen(true);
                    }}
                    className="flex-1 text-primary-foreground"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(table._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Carte d'ajout */}
        <Card className="foodHive-card border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setIsDialogOpen(true)}>
          <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground">Ajouter une table</h3>
            <p className="text-sm text-foreground text-center mt-2">
              Créez une nouvelle table pour votre restaurant
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog QR Code */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              QR Code - Table {selectedTable?.numero}
            </DialogTitle>
            <DialogDescription className="text-sm text-foreground">
              Ce QR code permet d'accéder au menu de la table {selectedTable?.numero}
            </DialogDescription>
          </DialogHeader>
          
          {qrCodeData && (
            <div className="flex flex-col items-center max-w-sm mx-auto space-y-6 p-6 bg-background rounded-xl border shadow-sm">
              {/* QR Code image */}
              <div className="p-4 bg-white rounded-lg border">
                <img
                  src={qrCodeData.qrCodeImage}
                  alt={`QR Code Table ${selectedTable?.numero}`}
                  className="w-48 h-48 object-contain"
                />
              </div>

              {/* Texte explicatif + code */}
              <div className="text-center space-y-2">
                <p className="text-sm text-primary-foreground">
                  Scannez ce code pour accéder au menu de la table <strong>{selectedTable?.numero}</strong>
                </p>
                <p className="text-xs font-mono text-primary-foreground bg-muted px-3 py-2 rounded-md break-all">
                  {qrCodeData.qrCode}
                </p>
              </div>

              {/* Bouton de téléchargement */}
              <Button onClick={downloadQRCode} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message si aucune table */}
      {tables.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <MapPin className="h-16 w-16 text-primary-foreground mx-auto mb-4" />
          <h3 className="text-lg text-primary-foreground font-semibold mb-2">Aucune table configurée</h3>
          <p className="text-primary-foreground mb-6">
            Commencez par ajouter des tables à votre restaurant
          </p>
          <Button className="foodHive-button-primary">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une table
          </Button>
        </motion.div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

            <div className="space-y-2 ">
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
              <Button type="button" variant="outline" className="text-primary-foreground" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingTable(null);
                }
              }>
                Annuler
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 foodHive-button-primary">
                {editingTable ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTablesPage;

