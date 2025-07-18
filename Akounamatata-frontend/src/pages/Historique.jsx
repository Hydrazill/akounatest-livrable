import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { commandeService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Historique = () => {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommande, setSelectedCommande] = useState(null);

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      setLoading(true);
      const response = await commandeService.getHistory(user.id, {
        limit: 50,
        sort: '-dateCommande'
      });
      setCommandes(response.commandes || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (commandes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <History className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold mb-4">Aucune commande</h2>
        <p className="text-muted-foreground mb-6">
          Vous n'avez pas encore passé de commande. 
          Explorez notre menu et passez votre première commande !
        </p>
        <Button onClick={() => window.location.href = '/menu'} className="bg-orange-600 hover:bg-orange-700">
          Découvrir le menu
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historique des commandes</h1>
          <p className="text-muted-foreground">
            {commandes.length} commande{commandes.length > 1 ? 's' : ''} passée{commandes.length > 1 ? 's' : ''}
          </p>
        </div>
        <History className="h-12 w-12 text-orange-600" />
      </div>

      <div className="space-y-4">
        {commandes.map((commande) => (
          <Card key={commande._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    Commande #{commande.numero}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(commande.dateCommande), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </span>
                    {commande.tableId && (
                      <span>Table {commande.tableId.numero}</span>
                    )}
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
                  {commande.plats.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.platId.nom} × {item.quantite}</span>
                      <span>{item.platId.prix * item.quantite} FCFA</span>
                    </div>
                  ))}
                  {commande.plats.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      ... et {commande.plats.length - 3} autre{commande.plats.length - 3 > 1 ? 's' : ''} plat{commande.plats.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold text-orange-600">
                    {commande.total} FCFA
                  </span>
                </div>

                {commande.commentaires && (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    <strong>Commentaires:</strong> {commande.commentaires}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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
              {/* Statut et informations */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Statut</h4>
                  <Badge className={getStatusColor(selectedCommande.statut)}>
                    {getStatusIcon(selectedCommande.statut)}
                    <span className="ml-1">{getStatusText(selectedCommande.statut)}</span>
                  </Badge>
                </div>
                {selectedCommande.tableId && (
                  <div>
                    <h4 className="font-medium mb-2">Table</h4>
                    <p>Table {selectedCommande.tableId.numero}</p>
                    <p className="text-sm text-muted-foreground">
                      Capacité: {selectedCommande.tableId.capacite} personnes
                    </p>
                  </div>
                )}
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
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
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

              {/* Dates importantes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium">Date de commande</h5>
                  <p className="text-muted-foreground">
                    {format(new Date(selectedCommande.dateCommande), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
                {selectedCommande.dateConfirmation && (
                  <div>
                    <h5 className="font-medium">Date de confirmation</h5>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedCommande.dateConfirmation), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                )}
                {selectedCommande.dateLivraison && (
                  <div>
                    <h5 className="font-medium">Date de livraison</h5>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedCommande.dateLivraison), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Historique;

