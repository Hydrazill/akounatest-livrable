import React from "react";
import { motion } from 'framer-motion';
import { MapPin, Users, Clock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

import { useTableStore, usePanierStore } from '@/lib/store';
import { formatDateTime } from '@/lib/utils';
import { tableService } from "../lib/api";

const TableOccupationBanner = () => {
    const { table, clearTable } = useTableStore();
    if(!table) return;

    const handleReleaseTable = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir libérer cette table ?')) {
            try {
                await tableService.freeTable(table._id);
                clearTable();
                usePanierStore.getState().clearPanier();
                toast.success('Table libérée avec succès');
            } catch (error) {
                toast.error('Erreur lors de la libération de la table');
            }
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-40 bg-primary/10 border-b border-primary/20 backdrop-blur-sm"
        >
            <div className="container mx-auto px-4 py-3">
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            {/* Informations de la table */}
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {table.numero}
                                </div>

                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-semibold text-lg">
                                            Table {table.numero}
                                        </h3>
                                        <Badge className="bg-green-500 text-white">
                                            Occupée
                                        </Badge>
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-1" />
                                            {table.capacite} places
                                        </div>

                                        {table.dateOccupation && (
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-1" />
                                                Depuis {formatDateTime(table.dateOccupation)}
                                            </div>
                                        )}

                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            Restaurant FoodHive
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-3 mt-4 md:mt-0">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm text-muted-foreground">
                                        Vous occupez actuellement cette table
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Libérez-la quand vous partez
                                    </p>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReleaseTable}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Libérer la table
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    )
}

export default TableOccupationBanner;

