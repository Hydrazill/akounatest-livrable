import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Table
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { commandeService, tableService } from '@/lib/api';
import { formatPrice, getStatusColor, getStatusLabel } from '@/lib/utils';
import { useEffect } from 'react';

const AdminDashboardPage = () => {
  // Récupérer les données du dashboard
  const { data: commandesData } = useQuery({
    queryKey: ['admin-commandes'],
    queryFn: () => commandeService.getCommandes({ limit: 10 }),
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  const { data: tablesData } = useQuery({
    queryKey: ['admin-tables'],
    queryFn: tableService.getTables,
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  const commandes = commandesData?.data?.commandes || [];
  const tables = tablesData?.data?.tables || [];

  useEffect(() => {
    console.log(commandes)
  }, [commandes]);

  // Calculer les statistiques
  const stats = {
    totalCommandes: commandes.length,
    commandesEnCours: commandes.filter(c => ['en_attente', 'confirmee', 'en_preparation'].includes(c.statut)).length,
    commandesTerminees: commandes.filter(c => c.statut === 'servie').length,
    chiffreAffaires: commandes.reduce((total, c) => total + (c.total || 0), 0),
    tablesOccupees: tables.filter(t => t.statutOccupee).length,
    tablesLibres: tables.filter(t => !t.statutOccupee).length,
  };

  const StatCard = ({ title, value, description, icon: Icon, trend, color = "primary" }) => (
    <Card className="foodHive-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-foreground">
          {description}
        </p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold foodHive-text-gradient">
          Tableau de Bord
        </h1>
        <p className="text-primary-foreground">
          Vue d'ensemble de votre restaurant FoodHive
        </p>
      </motion.div>

      {/* Statistiques principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="Chiffre d'affaires"
          value={formatPrice(stats.chiffreAffaires)}
          description="Total des ventes aujourd'hui"
          icon={DollarSign}
          trend="+12% vs hier"
          color="green-500"
        />
        
        <StatCard
          title="Commandes totales"
          value={stats.totalCommandes}
          description="Commandes passées aujourd'hui"
          icon={ShoppingBag}
          trend="+8% vs hier"
          color="blue-500"
        />
        
        <StatCard
          title="Tables occupées"
          value={`${stats.tablesOccupees}/${tables.length}`}
          description="Occupation actuelle"
          icon={Table}
          color="orange-500"
        />
        
        <StatCard
          title="Commandes en cours"
          value={stats.commandesEnCours}
          description="À traiter en priorité"
          icon={Clock}
          color="red-500"
        />
      </motion.div>

      {/* Grille principale */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commandes récentes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="foodHive-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Commandes Récentes
              </CardTitle>
              <CardDescription className="text-foreground">
                Les dernières commandes passées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commandes.slice(0, 5).map((commande) => (
                  <div key={commande._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">
                          Commande #{commande._id.slice(-6)}
                        </p>
                        <p className="text-xs text-foreground">
                          {commande?.tableId ?  `Table ${commande?.tableId?.numero}` : 'A livrer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(commande.statut)}>
                        {getStatusLabel(commande.statut)}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(commande.total)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {commandes.length === 0 && (
                  <p className="text-center text-foreground py-4">
                    Aucune commande pour le moment
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* État des tables */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="foodHive-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Table className="mr-2 h-5 w-5" />
                État des Tables
              </CardTitle>
              <CardDescription className="text-foreground">
                Occupation en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {tables.slice(0, 12).map((table) => (
                  <div
                    key={table._id}
                    className={`
                      p-3 rounded-lg border-2 text-center transition-colors
                      ${table.statutOccupee 
                        ? 'border-red-200 bg-red-50 text-red-700' 
                        : 'border-green-200 bg-green-50 text-green-700'
                      }
                    `}
                  >
                    <div className="text-sm font-medium">
                      Table {table.numero}
                    </div>
                    <div className="text-xs mt-1">
                      {table.statutOccupee ? 'Occupée' : 'Libre'}
                    </div>
                  </div>
                ))}
              </div>
              
              {tables.length === 0 && (
                <p className="text-center text-foreground py-4">
                  Aucune table configurée
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alertes et notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="foodHive-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Alertes et Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.commandesEnCours > 0 && (
                <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <Clock className="h-4 w-4 text-orange-600 mr-2" />
                  <span className="text-sm text-orange-800">
                    {stats.commandesEnCours} commande(s) en attente de traitement
                  </span>
                </div>
              )}
              
              {stats.tablesOccupees === tables.length && tables.length > 0 && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">
                    Toutes les tables sont occupées
                  </span>
                </div>
              )}
              
              {stats.commandesEnCours === 0 && (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    Toutes les commandes sont à jour
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboardPage;

