import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAuthStore } from '@/lib/store';
import { userService } from '@/lib/api';
import { validateEmail } from '@/lib/utils';
import { useEffect } from 'react';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
  });
  
  const getUser = async () => {
    const newUser = await userService.getUser(user.id);
    updateUser(newUser?.data?.user);
  }
  useEffect(() => {
    getUser();
  }, []);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.telephone) {
      newErrors.telephone = 'Le téléphone est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      nom: user?.nom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      nom: user?.nom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
    });
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const response = await userService.updateUser(user._id, formData);
      
      if (response.success) {
        updateUser(response.data.user);
        setIsEditing(false);
        toast.success('Profil mis à jour avec succès');
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="foodHive-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold foodHive-text-gradient">Mon Profil</CardTitle>
                <CardDescription className="text-sm text-foreground">
                  Gérez vos informations personnelles
                </CardDescription>
              </div>
              
              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="flex items-center space-x-2 text-sm text-primary-foreground"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="foodHive-button-primary"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user?.nom}</h3>
                <p className="text-foreground">{user?.role === 'admin' ? 'Administrateur' : user?.role === 'client' ? 'Client' : 'Gestionnaire'}</p>
              </div>
            </div>

            {/* Informations */}
            <div className="space-y-4">
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="nom" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Nom complet</span>
                </Label>
                {isEditing ? (
                  <Input
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={errors.nom ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-foreground bg-muted/50 px-3 py-2 rounded-md">
                    {user?.nom}
                  </p>
                )}
                {errors.nom && (
                  <p className="text-sm text-destructive">{errors.nom}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-foreground bg-muted/50 px-3 py-2 rounded-md">
                    {user?.email}
                  </p>
                )}
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="telephone" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Téléphone</span>
                </Label>
                {isEditing ? (
                  <Input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleChange}
                    className={errors.telephone ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-foreground bg-muted/50 px-3 py-2 rounded-md">
                    {user?.telephone}
                  </p>
                )}
                {errors.telephone && (
                  <p className="text-sm text-destructive">{errors.telephone}</p>
                )}
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="pt-6 border-t border-border">
              <h4 className="font-semibold mb-4">Informations du compte</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-foreground">Date d'inscription:</span>
                  <p className="font-medium">
                    {user?.dateCreation ? new Date(user.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-foreground">Dernier accès:</span>
                  <p className="font-medium">
                    {user?.dernierAcces ? new Date(user.dernierAcces).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProfilePage;

