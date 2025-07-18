import { useState, useEffect } from 'react';
import { adminService, commandeService } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Package, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques du dashboard
      const dashboardResponse = await adminService.getDashboard();
      setStats(dashboardResponse.stats);
      
      // Charger les commandes récentes
      const ordersResponse = await commandeService.getCommandes({ 
        limit: 10, 
        sort: '-dateCommande' 
      });
      setRecentOrders(ordersResponse.commandes || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_preparation':
        return 'bg-blue-100 text-blue-800';
      case 'prete':
        return 'bg-green-100 text-green-800';
      case 'livree':
        return 'bg-green-100 text-green-800';
      case 'annulee':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Données factices pour les graphiques (à remplacer par de vraies données)
  const salesData = [
    { name: 'Lun', ventes: 4000 },
    { name: 'Mar', ventes: 3000 },
    { name: 'Mer', ventes: 2000 },
    { name: 'Jeu', ventes: 2780 },
    { name: 'Ven', ventes: 1890 },
    { name: 'Sam', ventes: 2390 },
    { name: 'Dim', ventes: 3490 },
  ];

  const orderStatusData = [
    { name: 'En attente', value: 12, color: '#fbbf24' },
    { name: 'En préparation', value: 8, color: '#3b82f6' },
    { name: 'Prêtes', value: 5, color: '#10b981' },
    { name: 'Livrées', value: 45, color: '#6b7280' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrateur</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de l'activité du restaurant
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Commandes aujourd'hui
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.commandesAujourdhui || 24}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% par rapport à hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenus du jour
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.revenusAujourdhui || '125,000'} FCFA</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% par rapport à hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clients actifs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clientsActifs || 156}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +5% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Temps moyen de service
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tempsMoyenService || '18'} min</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              -2 min par rapport à hier
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des ventes */}
        <Card>
          <CardHeader>
            <CardTitle>Ventes de la semaine</CardTitle>
            <CardDescription>
              Évolution des ventes sur les 7 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} FCFA`, 'Ventes']} />
                <Bar dataKey="ventes" fill="#ea580c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des commandes */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des commandes</CardTitle>
            <CardDescription>
              Répartition actuelle des commandes par statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Commandes récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
          <CardDescription>
            Les 10 dernières commandes passées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">Commande #{order.numero}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.clientId?.nom} - Table {order.tableId?.numero}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(order.statut)}>
                      {getStatusText(order.statut)}
                    </Badge>
                    <span className="font-bold text-orange-600">
                      {order.total} FCFA
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune commande récente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertes et notifications */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-yellow-800">
              <p className="text-sm">• 3 plats bientôt en rupture de stock</p>
              <p className="text-sm">• 2 tables nécessitent un nettoyage</p>
              <p className="text-sm">• 1 commande en attente depuis 15 min</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Statut système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-green-800">
              <p className="text-sm">• Tous les services fonctionnent normalement</p>
              <p className="text-sm">• Base de données synchronisée</p>
              <p className="text-sm">• Dernière sauvegarde: il y a 2h</p>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
};

export default Dashboard;

