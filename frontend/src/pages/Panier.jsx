import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { panierService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const Panier = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [panier, setPanier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPanier();
  }, []);

  const loadPanier = async () => {
    try {
      setLoading(true);
      const response = await panierService.getPanier(user.id);
      setPanier(response.panier);
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
      toast.error('Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (platId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdating(true);
      await panierService.updateItem(user.id, {
        platId,
        quantite: newQuantity
      });
      await loadPanier();
      toast.success('Quantité mise à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (platId) => {
    try {
      setUpdating(true);
      await panierService.removeItem(user.id, platId);
      await loadPanier();
      toast.success('Article retiré du panier');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setUpdating(false);
    }
  };

  const clearPanier = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider votre panier ?')) return;
    
    try {
      setUpdating(true);
      await panierService.clearPanier(user.id);
      await loadPanier();
      toast.success('Panier vidé');
    } catch (error) {
      console.error('Erreur lors du vidage du panier:', error);
      toast.error('Erreur lors du vidage du panier');
    } finally {
      setUpdating(false);
    }
  };

  const proceedToCheckout = async () => {
    try {
      const currentTable = localStorage.getItem('currentTable');
      if (!currentTable) {
        toast.error('Veuillez d\'abord scanner le QR code d\'une table');
        navigate('/scan');
        return;
      }

      const table = JSON.parse(currentTable);
      
      const orderData = {
        tableId: table.id,
        commentaires: 'Commande passée depuis l\'application'
      };

      const response = await panierService.convertToOrder(user.id, orderData);
      
      if (response.commande) {
        toast.success('Commande passée avec succès!');
        navigate('/historique');
      }
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      const message = error.response?.data?.message || 'Erreur lors de la commande';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!panier || !panier.items || panier.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold mb-4">Votre panier est vide</h2>
        <p className="text-muted-foreground mb-6">
          Ajoutez des plats délicieux à votre panier pour commencer
        </p>
        <Button onClick={() => navigate('/menu')} className="bg-orange-600 hover:bg-orange-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au menu
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mon Panier</h1>
          <p className="text-muted-foreground">
            {panier.items.length} article{panier.items.length > 1 ? 's' : ''} dans votre panier
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/menu')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continuer les achats
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles du panier */}
        <div className="lg:col-span-2 space-y-4">
          {panier.items.map((item) => (
            <Card key={item.platId._id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {item.platId.imageUrl && (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.platId.imageUrl} 
                        alt={item.platId.nom}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{item.platId.nom}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.platId.description}
                    </p>
                    {item.platId.categorieId && (
                      <Badge variant="outline" className="mt-2">
                        {item.platId.categorieId.nom}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className="font-bold text-lg text-orange-600">
                      {item.platId.prix * item.quantite} FCFA
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.platId.prix} FCFA × {item.quantite}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.platId._id, item.quantite - 1)}
                      disabled={updating || item.quantite <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{item.quantite}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.platId._id, item.quantite + 1)}
                      disabled={updating}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeItem(item.platId._id)}
                    disabled={updating}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Résumé de la commande */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {panier.items.map((item) => (
                  <div key={item.platId._id} className="flex justify-between text-sm">
                    <span>{item.platId.nom} × {item.quantite}</span>
                    <span>{item.platId.prix * item.quantite} FCFA</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{panier.sousTotal} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA (19.25%)</span>
                  <span>{panier.taxes} FCFA</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-orange-600">{panier.total} FCFA</span>
              </div>
              
              <div className="space-y-2 pt-4">
                <Button 
                  onClick={proceedToCheckout}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={updating}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Passer la commande
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={clearPanier}
                  className="w-full"
                  disabled={updating}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Vider le panier
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Informations sur la table */}
          {(() => {
            const currentTable = localStorage.getItem('currentTable');
            if (currentTable) {
              const table = JSON.parse(currentTable);
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Table sélectionnée</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        Table {table.numero}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Capacité: {table.capacite} personnes
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="text-center text-yellow-800">
                    <p className="font-medium">Aucune table sélectionnée</p>
                    <p className="text-sm">Scannez le QR code d'une table avant de commander</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => navigate('/scan')}
                    >
                      Scanner maintenant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Panier;

