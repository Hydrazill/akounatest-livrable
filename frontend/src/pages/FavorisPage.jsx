import { useEffect } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useAuthStore, useFavorisStore, useTableStore, usePanierStore } from '../lib/store';
import { platService, userService, panierService } from '../lib/api';
import { formatPrice } from '../lib/utils'

const FavorisPage = () => {
    const [favoritesPlats, setFavoritesPlats] = useState([]);
    // Récupérer les favoris depuis l'API
    const { favoris, removeFavoris, addFavoris } = useFavorisStore();
    const fetchPlats = async () => {
        try {
            const plats = await Promise.all(
                favoris.map(async (id) => {
                    const res = await platService.getPlat(id);
                    return res?.data?.plat;
                })
            );
            setFavoritesPlats(plats);
        } catch (error) {
            console.error('Erreur lors du chargement des plats favoris:', error);
            throw error;
        }
    };
    useEffect(() => {
        if (favoris.length > 0) {
            fetchPlats();
        }
    }, [favoris]);

    const handleRemoveFavorite =  async (plat) => {
        try {
            await userService.removeFavorite(useAuthStore.getState().user?.id, plat._id);
            removeFavoris(plat._id);
            if (favoris.length > 0) {
                fetchPlats();
            }
            toast.success(`${plat.nom} retire des favoris`);
        } catch(error) {
            console.error(error)
            toast.error(error.message);
        }
    }

    const { table } = useTableStore();
    const { panier, setPanier } = usePanierStore();
    const handleAddToCart = async (plat) => {
        if(!table) {
            toast.error('Veillez scanner le code d\'une table pour ajouter un plat au panier');
            return;
        }
    
        const index = panier?.items?.findIndex(item => item.platId._id === plat._id) || -1;
        const clientId = useAuthStore.getState().user?.id || import.meta.env.VITE_USER;
        if(index < 0) {
            // ajouter un nouveau plat au panier
            const itemData = {
                platId: plat._id,
                quantite: 1,
                commentaire: '',
                tableId: table._id
            }
            try {
                const response = await panierService.addToPanier(clientId, itemData);
                setPanier(response?.data?.panier);
                toast.success('plat ajoute au panier');
            } catch(error) {
                console.error('erreur lors de l\'ajout au panier: ', error);
                toast.error(error.message);
            }
        } else {
            // incrementer la quantite d'un plat
            const itemData = {
                platId: plat._id,
                quantite: panier.items[index].quantite + 1,
                commentaire: '',
                tableId: table._id
            }
            try {
                const response = await panierService.updateItem(clientId, itemData);
                setPanier(response?.data?.panier);
                toast.success('panier mis a jour');
            } catch(error) {
                console.error('erreur lors de la mise a jour du panier: ', error);
                toast.error(error.message);
            }
        }
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
                    <Heart className="mr-3 h-8 w-8 text-red-500" />
                    Mes Favoris
                </h1>
                <p className="text-primary-foreground max-w-2xl mx-auto">
                    Retrouvez tous vos plats préférés en un seul endroit
                </p>
            </motion.div>

            {favoris.length === 0 ? (
                /* Aucun favori */
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                >
                    <Heart className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
                    <h2 className="text-2xl font-semibold mb-4">Aucun favori pour le moment</h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Explorez notre menu et ajoutez vos plats préférés à vos favoris en cliquant sur le cœur
                    </p>
                    <Button asChild className="foodHive-button-primary">
                        <a href="/menu">Découvrir le menu</a>
                    </Button>
                </motion.div>
            ) : (
                /* Grille des favoris */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {favoritesPlats.map((plat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="foodHive-card group hover:shadow-lg transition-all duration-300">
                                {/* Image */}
                                <div className="relative overflow-hidden rounded-t-lg">
                                    <img
                                        src={plat.imageUrl}
                                        alt={plat.nom}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    
                                    {/* Bouton supprimer des favoris */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 bg-background/80 hover:bg-background text-red-500 hover:text-red-600"
                                        onClick={() => handleRemoveFavorite(plat)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

                                    {/* Badge favori */}
                                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                        <Heart className="h-3 w-3 mr-1 fill-current" />
                                        Favori
                                    </div>
                                </div>

                                <CardContent className="p-4">
                                    {/* Nom et prix */}
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{plat.nom}</h3>
                                        <span className="text-lg font-bold text-primary">
                                            {formatPrice(plat.prix)}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-foreground text-sm mb-4 line-clamp-2">
                                        {plat.description}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex space-x-2">
                                        <Button
                                            className="flex-1 foodHive-button-primary"
                                            onClick={() => handleAddToCart(plat)}
                                            disabled={!plat.disponible}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            {plat.disponible ? 'Ajouter' : 'Indisponible'}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveFavorite(plat)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Heart className="h-4 w-4 fill-current" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}

export default FavorisPage;

