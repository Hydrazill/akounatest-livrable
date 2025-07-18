import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { userService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Profil = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.email || !formData.telephone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      const response = await userService.updateUser(user.id, formData);
      
      if (response.user) {
        updateUser(response.user);
        setIsEditing(false);
        toast.success('Profil mis à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: user.nom || '',
      email: user.email || '',
      telephone: user.telephone || ''
    });
    setIsEditing(false);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <Avatar className="h-24 w-24 mx-auto mb-4">
          <AvatarFallback className="text-2xl">
            {getInitials(user.nom)}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold">{user.nom}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Gérez vos informations de profil
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet</Label>
                <Input
                  id="nom"
                  name="nom"
                  type="text"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleChange}
                  required
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{user.nom}</p>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">Adresse email</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{user.telephone}</p>
                  <p className="text-sm text-muted-foreground">Numéro de téléphone</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>
            Détails de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {format(new Date(user.dateCreation), 'dd MMMM yyyy', { locale: fr })}
              </p>
              <p className="text-sm text-muted-foreground">Date d'inscription</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium capitalize">{user.role}</p>
              <p className="text-sm text-muted-foreground">Type de compte</p>
            </div>
          </div>

          {user.dateVerification && (
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(new Date(user.dateVerification), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-sm text-muted-foreground">Date de vérification</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques utilisateur */}
      {user.role === 'client' && (
        <Card>
          <CardHeader>
            <CardTitle>Mes statistiques</CardTitle>
            <CardDescription>
              Aperçu de votre activité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {user.preferences?.historiqueCommandes?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Commandes</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {user.preferences?.favoris?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Favoris</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {user.preferences?.platsPreferences?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Préférences</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zone de danger</CardTitle>
          <CardDescription>
            Actions irréversibles sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Supprimer le compte</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Cette action supprimera définitivement votre compte et toutes vos données.
                Cette action ne peut pas être annulée.
              </p>
              <Button 
                variant="destructive" 
                onClick={() => toast.error('Fonctionnalité non implémentée')}
              >
                Supprimer le compte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profil;

