import React from "react";
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TableOccupationBanner from "@/components/TableOccupationBanner";

import { useQRCodeHandler } from "../hooks/useQRCodeHandler";
import { categorieService, platService, userService, panierService } from "../lib/api";
import { useTableStore, useFavorisStore, useAuthStore, usePanierStore } from "../lib/store";
import { formatPrice } from '@/lib/utils';

const MenuPage = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('all');

    const { table } = useTableStore();
    
    // Récupérer les catégories
    const { data: categoriesData } = useQuery({
        queryKey: ['user-categories'],
        queryFn: categorieService.getCategories,
        refetchInterval: 30000,
    });
    const categories = categoriesData?.data?.categories || [];
    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c._id === categoryId);
        return category?.nom || 'Autres';
    };

    // Récupérer les plats
    const { data: platsData, isLoading } = useQuery({
        queryKey: ['user-plats'],
        queryFn: platService.getPlats,
        refetchInterval: 30000,
    });
    const plats = platsData?.data?.plats || [];
    // Filtrer les plats
    const filteredPlats = plats.filter(plat => {
        const matchesSearch = 
            plat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plat.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || plat.categorieId._id === selectedCategory;
        
        return matchesSearch && matchesCategory && plat.disponible;
    });
    const { favoris, removeFavoris, addFavoris } = useFavorisStore();
    const isFavorite = (platId) => {
        return favoris.includes(platId);
    }
    const handleToggleFavorite = async (plat) => {
        if(!useAuthStore.getState().user) {
            toast.error('Veillez vous authentifier pour ajouter un favoris');
            return;
        }
        if(!isFavorite(plat._id)) {
            try {
                await userService.addFavorite(useAuthStore.getState().user.id, plat._id);
                addFavoris(plat._id);
                toast.success(`${plat.nom} ajoute au favoris`);
            } catch(error) {
                toast.error(error.message);
            }
        } else {
            try {
                await userService.removeFavorite(useAuthStore.getState().user.id, plat._id);
                removeFavoris(plat._id);
                toast.success(`${plat.nom} retire des favoris`);
            } catch(error) {
                console.error(error)
                toast.error(error.message);
            }
        }
    }
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

    // Gérer le QR code
    const { isProcessingQR, hasQRParams } = useQRCodeHandler();
    if (isLoading || isProcessingQR) {
        return (
        <div className="container mx-auto px-4 py-8">
            {/* Banner QR si applicable */}
            {hasQRParams && <TableOccupationBanner />}
            
            {isProcessingQR && (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Traitement du QR code...</p>
            </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded mb-4" />
                    <div className="h-8 bg-muted rounded" />
                </CardContent>
                </Card>
            ))}
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Banner d'occupation de table */}
            <TableOccupationBanner />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold mb-4 foodHive-text-gradient">
                        Notre Menu
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Découvrez nos délicieux plats inspirés de la cuisine africaine contemporaine
                    </p>
                    
                    {table && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20"
                        >
                            <p className="text-sm text-primary font-medium">
                                🎉 Bienvenue à la table {table.number} ! Commandez directement depuis votre téléphone.
                            </p>
                        </motion.div>
                    )}
                </motion.div>

                {/* Filtres */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col md:flex-row gap-4 mb-8"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Rechercher un plat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </motion.div>

                {/* Onglets par catégorie */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                            <TabsTrigger value="all">Tous</TabsTrigger>
                            {categories.slice(0, 5).map((category) => (
                                <TabsTrigger key={category._id} value={category._id}>
                                    {category.nom}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value={selectedCategory} className="mt-12">
                            {/* Grille des plats */}
                            <AnimatePresence>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredPlats.map((plat, index) => (
                                        <motion.div
                                            key={plat._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
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

                                                    {/* Badge catégorie */}
                                                    <Badge className="absolute top-2 left-2 bg-primary/90 text-white">
                                                        {getCategoryName(plat.categorieId._id)}
                                                    </Badge>

                                                    {/* Bouton favori */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`absolute top-2 right-2 bg-background/50 hover:bg-background/60 ${
                                                            isFavorite(plat._id) ? 'text-red-500' : 'text-muted-foreground'
                                                        }`}
                                                        onClick={() => handleToggleFavorite(plat)}
                                                    >
                                                        <Heart 
                                                            className={`h-4 w-4 ${isFavorite(plat._id) ? 'fill-current' : ''}`} 
                                                        />
                                                    </Button>

                                                    {/* Note si disponible */}
                                                    {plat.note && (
                                                        <div className="absolute bottom-2 left-2 flex items-center bg-background/90 px-2 py-1 rounded">
                                                            <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                                                            <span className="text-xs font-medium">{plat.note}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <CardContent className="p-4">
                                                    {/* En-tête */}
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-semibold text-lg">{plat.nom}</h3>
                                                        <span className="text-lg font-bold text-primary">
                                                            {formatPrice(plat.prix)}
                                                        </span>
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                                        {plat.description}
                                                    </p>

                                                    {/* Allergènes */}
                                                    {plat.allergenes && plat.allergenes.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-4">
                                                            {plat.allergenes.slice(0, 3).map((allergene) => (
                                                                <Badge key={allergene} variant="outline" className="text-xs">
                                                                    {allergene}
                                                                </Badge>
                                                            ))}
                                                            {plat.allergenes.length > 3 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{plat.allergenes.length - 3}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            className="flex-1 foodHive-button-primary"
                                                            onClick={() => handleAddToCart(plat)}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Ajouter
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleToggleFavorite(plat)}
                                                            className={isFavorite(plat._id) ? 'text-red-500 border-red-200 bg-background/50 hover:bg-background/60' : ''}
                                                        >
                                                            <Heart className={`h-4 w-4 ${isFavorite(plat._id) ? 'fill-current' : ''}`} />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </AnimatePresence>

                            {/* Message si aucun plat */}
                            {filteredPlats.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-12"
                                >
                                    <div className="text-6xl mb-4">🍽️</div>
                                    <h3 className="text-lg font-semibold mb-2">Aucun plat trouvé</h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm 
                                            ? 'Aucun plat ne correspond à votre recherche'
                                            : 'Aucun plat disponible dans cette catégorie'
                                        }
                                    </p>
                                </motion.div>
                            )}
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </div>
        </div>
    )
}

export default MenuPage;

