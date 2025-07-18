import { useState, useEffect } from 'react';
import { commandeService } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Package, 
  Search, 
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Commandes = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCommandes();
  }, []);

  const loadCommandes = async () => {
    try {
      setLoading(true);
      const response = await commandeService.getCommandes({
        limit: 100,
        sort: '-dateCommande'
      });
      setCommandes(response.commandes || []);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (commandeId, newStatus) => {
    try {
      setUpdating(true);
      await commandeService.updateStatus(commandeId, { statut: newStatus });
      await loadCommandes();
      toast.success('Statut mis à jour');
      setSelectedCommande(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'en_attente':
        return <Clock className="h-4 w-4" />;
      case 'en_preparation':
        return <Package className="h-4 w-4" />;
      case 'prete':
        return <CheckCircle className="h-4 w-4" />;
      case 'livree':
        return <CheckCircle className="h-4 w-4" />;
      case 'annulee':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_preparation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'livree':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'annulee':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'en_attente':
        return 'En attente';
      case 'en_preparation':
        return 'En préparation';
      case 'prete':
        return 'Prête';
      case 'livree':
        return 'Livrée';
      case 'annulee':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'en_attente':
        return 'en_preparation';
      case 'en_preparation':
        return 'prete';
      case 'prete':
        return 'livree';
      default:
        return null;
    }
  };

  const getNextStatusText = (currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? getStatusText(nextStatus) : null;
  };

  const filteredCommandes = commandes.filter(commande => {
    const matchesSearch = commande.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commande.clientId?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commande.tableId?.numero.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || commande.statut === statusFilter;
    return matchesSearch && matchesStatus;
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
          <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
          <p className="text-muted-foreground">
            {filteredCommandes.length} commande{filteredCommandes.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={loadCommandes} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro, client ou table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="en_preparation">En préparation</SelectItem>
            <SelectItem value="prete">Prête</SelectItem>
            <SelectItem value="livree">Livrée</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {filteredCommandes.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune commande trouvée</h3>
            <p className="text-muted-foreground">
              Aucune commande ne correspond à vos critères de recherche
            </p>
          </div>
        ) : (
          filteredCommandes.map((commande) => (
            <Card key={commande._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Commande #{commande.numero}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4">
                      <span>
                        {commande.clientId?.nom || 'Client inconnu'}
                      </span>
                      <span>
                        Table {commande.tableId?.numero || 'N/A'}
                      </span>
                      <span>
                        {format(new Date(commande.dateCommande), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(commande.statut)}>
                      {getStatusIcon(commande.statut)}
                      <span className="ml-1">{getStatusText(commande.statut)}</span>
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCommande(commande)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Aperçu des plats */}
                  <div className="space-y-2">
                    {commande.plats.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.platId.nom} × {item.quantite}</span>
                        <span>{item.platId.prix * item.quantite} FCFA</span>
                      </div>
                    ))}
                    {commande.plats.length > 2 && (
                      <div className="text-sm text-muted-foreground">
                        ... et {commande.plats.length - 2} autre{commande.plats.length - 2 > 1 ? 's' : ''} plat{commande.plats.length - 2 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xl font-bold text-orange-600">
                      {commande.total} FCFA
                    </span>
                    
                    <div className="flex space-x-2">
                      {getNextStatus(commande.statut) && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(commande._id, getNextStatus(commande.statut))}
                          disabled={updating}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Marquer comme {getNextStatusText(commande.statut)}
                        </Button>
                      )}
                      
                      {commande.statut !== 'annulee' && commande.statut !== 'livree' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateStatus(commande._id, 'annulee')}
                          disabled={updating}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog pour les détails de la commande */}
      {selectedCommande && (
        <Dialog open={!!selectedCommande} onOpenChange={() => setSelectedCommande(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Détails de la commande #{selectedCommande.numero}
              </DialogTitle>
              <DialogDescription>
                Commande passée le {format(new Date(selectedCommande.dateCommande), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informations client et table */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Client</h4>
                  <p>{selectedCommande.clientId?.nom || 'Client inconnu'}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCommande.clientId?.email}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Table</h4>
                  <p>Table {selectedCommande.tableId?.numero || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    Capacité: {selectedCommande.tableId?.capacite} personnes
                  </p>
                </div>
              </div>

              {/* Statut avec actions */}
              <div>
                <h4 className="font-medium mb-2">Statut</h4>
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(selectedCommande.statut)}>
                    {getStatusIcon(selectedCommande.statut)}
                    <span className="ml-1">{getStatusText(selectedCommande.statut)}</span>
                  </Badge>
                  
                  <div className="flex space-x-2">
                    <Select 
                      value={selectedCommande.statut} 
                      onValueChange={(newStatus) => updateStatus(selectedCommande._id, newStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="en_preparation">En préparation</SelectItem>
                        <SelectItem value="prete">Prête</SelectItem>
                        <SelectItem value="livree">Livrée</SelectItem>
                        <SelectItem value="annulee">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Plats commandés */}
              <div>
                <h4 className="font-medium mb-4">Plats commandés</h4>
                <div className="space-y-3">
                  {selectedCommande.plats.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium">{item.platId.nom}</h5>
                        <p className="text-sm text-muted-foreground">
                          {item.platId.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline">
                            Quantité: {item.quantite}
                          </Badge>
                          <Badge variant="outline">
                            {item.platId.prix} FCFA/unité
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-600">
                          {item.platId.prix * item.quantite} FCFA
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Résumé financier */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3">Résumé</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{selectedCommande.sousTotal} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA</span>
                    <span>{selectedCommande.taxes} FCFA</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-orange-600">{selectedCommande.total} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Commentaires */}
              {selectedCommande.commentaires && (
                <div>
                  <h4 className="font-medium mb-2">Commentaires</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    {selectedCommande.commentaires}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Commandes;

