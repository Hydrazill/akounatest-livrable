import React from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import toast from "react-hot-toast";

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

import { panierService } from "../lib/api";
import { usePanierStore, useUIStore, useAuthStore, useTableStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';

const Cart = () => {
    const { closeCart } = useUIStore();
    const { itemCount, panier, setPanier, clearPanier } = usePanierStore();
    const { table } = useTableStore();

    const handleRemoveItem = async (platId) => {
        const clientId = useAuthStore.getState().user?.id || import.meta.env.VITE_USER;
        try {
            const response = await panierService.removeItem(clientId, platId, table._id);
            toast.success('plat retire du panier');
            setPanier(response?.data?.panier);
        } catch(error) {
            console.error('erreur lors de la suppression au panier: ', error);
            toast.error(error.message);
        }
    }

    const handleQuantityChange = async (platId, quantite, index) => {
        const clientId = useAuthStore.getState().user?.id || import.meta.env.VITE_USER;
        if(quantite === 0) {
            await handleRemoveItem(platId);
        } else {
            const itemData = {
                platId: platId,
                quantite: quantite,
                commentaire: '',
                tableId: table._id
            }
            try {
                const response = await panierService.updateItem(clientId, itemData);
                toast.success('panier mis a jour');
                setPanier(response?.data?.panier);
            } catch(error) {
                console.error('erreur lors de la mise a jour du panier: ', error);
                toast.error(error.message);
            }
        }
    }

    const handleClearPanier = async () => {
        const clientId = useAuthStore.getState().user?.id || import.meta.env.VITE_USER;
        try {
            const response = await panierService.clearPanier(clientId, table._id);
            toast.success('Panier vider');
            setPanier(response?.data?.panier);
        } catch(error) {
            console.error('erreur lors de la suppression des plats du panier: ', error);
            toast.error(error.message);
        }
    }

    const handleCheckout = async () => {
        const clientId = useAuthStore.getState().user?.id || import.meta.env.VITE_USER;
        try {
            const response = await panierService.convertToOrder(clientId, {
                tableId: table._id,
            });
            toast.success('Commande passer. Veillez patienter...');
            closeCart();
            clearPanier();
        } catch(error) {
            console.error('erreur lors de la suppression au panier: ', error);
            toast.error(error.message);
        }
    }

    const unavailableItemLength = (panier) => {
        return panier?.items.reduce((count, item) => {
            return item.platId.disponible ? count : count + 1;
        }, 0);
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50"
                onClick={closeCart}
            >
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center space-x-2">
                            <ShoppingBag className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Mon Panier</h2>
                            {itemCount > 0 && (
                                <Badge variant="secondary">{itemCount}</Badge>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={closeCart}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Contenu */}
                    <div className="flex flex-col h-full">
                        {(panier?.items.length === 0) || (panier?.items.length === unavailableItemLength(panier)) ? (
                            /* Panier vide */
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">Votre panier est vide</h3>
                                <p className="text-muted-foreground mb-6">
                                    Ajoutez des plats délicieux à votre panier pour commencer
                                </p>
                                <Button onClick={closeCart}>
                                    Découvrir le menu
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Liste des articles */}
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        {panier.items.map((item, index) => (
                                            <motion.div
                                                key={index}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="foodHive-card p-4"
                                            >
                                                <div className="flex space-x-3">
                                                    {/* Image du plat */}
                                                    <div className="flex-shrink-0">
                                                        <img
                                                            src={item.platId.imageUrl}
                                                            alt={item.platId.nom}
                                                            className="w-16 h-16 object-cover rounded-md"
                                                        />
                                                    </div>

                                                    {/* Détails */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm truncate">
                                                            {item.platId.nom}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatPrice(item.platId.prix)}
                                                        </p>

                                                        {/* Commentaires */}
                                                        {item.commentaires && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Note: {item.commentaires}
                                                            </p>
                                                        )}

                                                        {/* Contrôles quantité */}
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                    onClick={() => handleQuantityChange(item.platId._id, item.quantite - 1, index)}
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </Button>
                                                                <span className="text-sm font-medium w-8 text-center">
                                                                    {item.quantite}
                                                                </span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                    onClick={() => handleQuantityChange(item.platId._id, item.quantite + 1, index)}
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm font-medium">
                                                                    {formatPrice(item.quantite * item.prixUnitaire)}
                                                                </span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                    onClick={() => handleRemoveItem(item.platId._id)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {/* Footer avec total et actions */}
                                    <div className="border-t border-border p-4 space-y-4">
                                        {/* Total */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold">Total</span>
                                            <span className="text-lg font-bold text-primary">
                                                {formatPrice(panier.total)}
                                            </span>
                                        </div>

                                        <Separator />

                                        {/* Actions */}
                                        <div className="space-y-2">
                                            <Button 
                                                className="w-full foodHive-button-primary"
                                                onClick={handleCheckout}
                                            >
                                                Commander ({formatPrice(panier.total)})
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="w-full"
                                                onClick={handleClearPanier}
                                            >
                                                Vider le panier
                                            </Button>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default Cart;

