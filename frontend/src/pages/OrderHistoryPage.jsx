
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { History, Calendar, Clock, MapPin, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { commandeService, userService } from '@/lib/api';
import { useAuthStore, useTableStore } from '../lib/store';
import { formatPrice, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';

const OrderHistoryPage = () => {
  const [commandes, setCommandes] = useState([]);
  // Récupérer l'historique des commandes
  const { user } = useAuthStore();
  const { table } = useTableStore();
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-infos'],
    queryFn: () => userService.getUser(user?.id),
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  const userRedeem = userData?.data?.user || null;
  
  useEffect(() => {
    let isMounted = true;
    const fetchCommandes = async () => {
      if (!userRedeem?.historiqueCommandes) {
        setCommandes([]);
        return;
      }
      try {
        const commandes = await Promise.all(
          userRedeem?.historiqueCommandes.map(id =>
            commandeService.getUserCommande(id).then(response => response?.data?.commande)
          )
        );
        console.log(commandes)
        if (isMounted) setCommandes(commandes);
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        toast.error('Erreur lors de la récupération des commandes.');
        if (isMounted) setCommandes([]);
      }
    };
    fetchCommandes();
    return () => { isMounted = false; };
  }, [userRedeem]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 foodHive-text-gradient flex items-center justify-center">
          <History className="mr-3 h-8 w-8" />
          Historique des Commandes
        </h1>
        <p className="text-primary-foreground max-w-2xl mx-auto">
          Retrouvez toutes vos commandes passées chez FoodHive
        </p>
      </motion.div>

      {commandes?.length === 0 ? (
        /* Aucune commande */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <History className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-4">Aucune commande pour le moment</h2>
          <p className="text-primary-foreground mb-8 max-w-md mx-auto">
            Vous n'avez pas encore passé de commande. Découvrez notre délicieux menu !
          </p>
          <Button asChild className="foodHive-button-primary">
            <a href="/menu">Commander maintenant</a>
          </Button>
        </motion.div>
      ) : (
        /* Liste des commandes */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {commandes.map((commande, index) => (
            <motion.div
              key={commande._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="foodHive-card">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Commande #{commande.numero || commande._id.slice(-6)}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-foreground mt-1">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDateTime(commande.dateCommande)}
                        </div>
                        {commande.tableId && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Table {commande?.tableId?.numero || commande?.tableId?._id}
                          </div>
                        )}
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
                  <div className="space-y-3">
                    {commande.items?.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-xs font-medium">
                            {item.quantite}x
                          </div>
                          <div>
                            <p className="font-medium">{item?.nom || 'Plat supprimé'}</p>
                            {item.commentaires && (
                              <p className="text-sm text-muted-foreground">
                                Note: {item.commentaires}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-medium">
                          {formatPrice(item?.prixUnitaire)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Résumé */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-foreground">
                      {commande.items?.length || 0} article(s)
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">Total</p>
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(commande.total)}
                      </p>
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  {(commande.dateConfirmation || commande.dateLivraison) && (
                    <>
                      <Separator className="my-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {commande.dateConfirmation && (
                          <div className="flex items-center text-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            Confirmée le {formatDateTime(commande.dateConfirmation)}
                          </div>
                        )}
                        {commande.dateLivraison && (
                          <div className="flex items-center text-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            Servie le {formatDateTime(commande.dateLivraison)}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  {/* <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les détails
                    </Button>
                  </div> */}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default OrderHistoryPage;

