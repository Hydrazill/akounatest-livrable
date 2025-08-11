import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { commandeService } from '@/lib/api';
import { formatPrice, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';

const AdminCommandesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null); // Pour le modal détails
  
  const queryClient = useQueryClient();

  // Récupérer les commandes
  const { data: commandesData, isLoading } = useQuery({
    queryKey: ['admin-commandes', statusFilter],
    queryFn: () => commandeService.getCommandes({ 
      statut: statusFilter !== 'all' ? statusFilter : undefined,
      limit: 50 
    }),
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  const commandes = commandesData?.data?.commandes || [];

  const CommandeDetailsModal = ({ commande, onClose }) => {
    if (!commande) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-card rounded-lg shadow-lg w-full max-w-lg mx-4 relative animate-fade-in">
          <button
            className="absolute top-2 right-2 p-2 text-xl text-foreground hover:text-primary transition-colors"
            onClick={onClose}
            aria-label="Fermer"
          >
            &times;
          </button>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Détails de la commande #{commande._id.slice(-6)}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-foreground mt-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDateTime(commande.dateCommande)}
                </div>
                <div>
                  Table {commande.tableId?.numero || 'N/A'}
                </div>
                <div>
                  {commande.clientId?.nom || 'Client anonyme'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="font-semibold text-primary">Liste des plats :</div>
                {commande?.items?.length > 0 ? (
                  commande?.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-muted py-2">
                      <div>
                        <span className="font-bold">{item.quantite}x </span>
                        <span>{item.platId?.nom || 'Plat supprimé'}</span>
                        {item.commentaires && (
                          <span className="ml-2 text-xs text-muted-foreground italic">({item.commentaires})</span>
                        )}
                      </div>
                      <span className="font-medium">{formatPrice(item?.quantite * item?.prixUnitaire)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-foreground italic">Aucun plat dans cette commande</div>
                )}
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-foreground">
                  {commande.items?.length || 0} plat(s)
                </span>
                <span className="text-lg font-bold text-primary">
                  Total&nbsp;: {formatPrice(commande.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Mutation pour changer le statut d'une commande
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => commandeService.updateStatus(id, { statut: status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-commandes']);
      toast.success('Statut mis à jour');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour du statut :', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });

  // Filtrer les commandes
  const filteredCommandes = commandes.filter(commande => {
    const matchesSearch = 
      commande._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.tableId?.numero?.toString().includes(searchTerm) ||
      commande.clientId?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleStatusChange = (commandeId, newStatus) => {
    updateStatusMutation.mutate({ id: commandeId, status: newStatus });
  };

  const getStatusActions = (commande) => {
    const actions = [];
    
    switch (commande.statut) {
      case 'en_attente':
        actions.push(
          <Button
            key="confirm"
            size="sm"
            onClick={() => handleStatusChange(commande._id, 'confirmee')}
            className="foodHive-button-primary"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmer
          </Button>
        );
        actions.push(
          <Button
            key="cancel"
            size="sm"
            variant="destructive"
            onClick={() => handleStatusChange(commande._id, 'annulee')}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Annuler
          </Button>
        );
        break;
        
      case 'confirmee':
        actions.push(
          <Button
            key="prepare"
            size="sm"
            onClick={() => handleStatusChange(commande._id, 'en_preparation')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Clock className="h-3 w-3 mr-1" />
            En préparation
          </Button>
        );
        break;
        
      case 'en_preparation':
        actions.push(
          <Button
            key="ready"
            size="sm"
            onClick={() => handleStatusChange(commande._id, 'prete')}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Prête
          </Button>
        );
        break;
        
      case 'prete':
        actions.push(
          <Button
            key="serve"
            size="sm"
            onClick={() => handleStatusChange(commande._id, 'servie')}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Servir
          </Button>
        );
        break;
    }
    
    return actions;
  };

  const getCommandesByStatus = (status) => {
    return filteredCommandes.filter(c => c.statut === status);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
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
            Gestion des Commandes
          </h1>
          <p className="text-primary-foreground">
            Suivez et gérez toutes les commandes en temps réel
          </p>
        </div>
        
        <Button
          onClick={() => queryClient.invalidateQueries(['admin-commandes'])}
          variant="outline"
          className="mt-4 md:mt-0 text-primary-foreground"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </>
          )}
        </Button>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par ID, table ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 placeholder:text-primary-foreground"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="confirmee">Confirmée</SelectItem>
            <SelectItem value="en_preparation">En préparation</SelectItem>
            <SelectItem value="prete">Prête</SelectItem>
            <SelectItem value="servie">Servie</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Onglets par statut */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="en_attente" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="en_attente" className="relative">
              En attente
              {getCommandesByStatus('en_attente').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {getCommandesByStatus('en_attente').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmee">
              Confirmées
              {getCommandesByStatus('confirmee').length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {getCommandesByStatus('confirmee').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="en_preparation">
              En préparation
              {getCommandesByStatus('en_preparation').length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {getCommandesByStatus('en_preparation').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="prete">
              Prêtes
              {getCommandesByStatus('prete').length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {getCommandesByStatus('prete').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="annulee">
              Annulées
              {getCommandesByStatus('annulee').length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {getCommandesByStatus('annulee').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {['en_attente', 'confirmee', 'en_preparation', 'prete', 'annulee'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4 mt-6">
              {getCommandesByStatus(status).map((commande) => (
                <Card key={commande._id} className="foodHive-card">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Commande #{commande._id.slice(-6)}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDateTime(commande.dateCommande)}
                          </div>
                          <div>
                            Table {commande.tableId?.numero || 'N/A'}
                          </div>
                          <div>
                            {commande.clientId?.nom || 'Client anonyme'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-4 md:mt-0">
                        <Badge className={getStatusColor(commande.statut)}>
                          {getStatusLabel(commande.statut)}
                        </Badge>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(commande.total)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Liste des plats */}
                    <div className="space-y-2 mb-4">
                      {commande.plats?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>
                            {item.quantite}x {item.plat?.nom || 'Plat supprimé'}
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.sousTotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 text-primary-foreground">
                      {getStatusActions(commande)}
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(commande)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {getCommandesByStatus(status).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune commande {getStatusLabel(status).toLowerCase()}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
      
      {/* Modal détails commande */}
      <CommandeDetailsModal 
        commande={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
};

export default AdminCommandesPage;