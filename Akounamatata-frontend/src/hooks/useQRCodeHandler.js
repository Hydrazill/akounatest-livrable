import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useTableStore, usePanierStore } from '../lib/store'
import { tableService, panierService } from '../lib/api';

export const useQRCodeHandler = () => {
  const [searchParams] = useSearchParams();
  const [isProcessingQR, setIsProcessingQR] = useState(false);
//   const [qrData, setQrData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const processQRCode = async () => {
        // Vérifier si nous avons les paramètres QR code
        const type = searchParams.get('type');
        const id = searchParams.get('id');
        const number = searchParams.get('number');
        const timestamp = searchParams.get('timestamp');

        if (type && id && number && timestamp) {
            setIsProcessingQR(true);
            try {
                useTableStore.getState().setQrData({
                    type,
                    id,
                    number: parseInt(number),
                    timestamp: parseInt(timestamp)
                });

                // Marquer la table comme occupée
                const response = await tableService.occupyTable(id, useTableStore.getState().qrData);

                 if (response.success) {
                    const tableData = response.data.table;

                    try {
                        const responseP = await panierService.getPanier(import.meta.env.VITE_USER, { tableId: id });
                        if (responseP.success) {
                          usePanierStore.getState().setPanier(responseP?.data?.panier);
                        } else {
                            console.error('Panier non chargé:', responseP);
                            usePanierStore.getState().clearPanier();
                        }
                    } catch (err) {
                        console.error('Erreur chargement panier:', err);
                    }

                    useTableStore.getState().setTable(tableData);
                    toast.success(
                        `Bienvenue à la table ${number} ! Vous pouvez maintenant consulter notre menu.`,
                        { duration: 5000 }
                    );
                    navigate('/', { replace: true });
                }
            } catch(error) {
                console.error('Erreur lors du traitement du QR code:', error);
          
                // Gérer différents types d'erreurs
                if (error.message?.includes('déjà occupée')) {
                    toast.error('Cette table est déjà occupée. Veuillez contacter le personnel.');
                } else if (error.message?.includes('expiré')) {
                    toast.error('Ce QR code a expiré. Veuillez demander un nouveau code au personnel.');
                } else {
                    toast.error('Erreur lors de l\'accès à la table. Veuillez réessayer.');
                }
            } finally {
                setIsProcessingQR(false);
            }
        }
    }

    if(!useTableStore.getState().table) processQRCode();
    // else console.log(useTableStore.getState().table);
  }, [searchParams]);

  return {
    isProcessingQR,
    // qrData,
    hasQRParams: !!(
      searchParams.get('type') && 
      searchParams.get('id') && 
      searchParams.get('number') && 
      searchParams.get('timestamp')
    )
  };
};

