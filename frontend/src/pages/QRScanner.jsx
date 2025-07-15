import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { tableService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [validatedTable, setValidatedTable] = useState(null);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      // Nettoyer le scanner lors du démontage du composant
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setValidatedTable(null);

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        // Succès du scan
        setScanResult(decodedText);
        setIsScanning(false);
        scanner.clear();
        
        // Valider le QR code avec l'API
        await validateQRCode(decodedText);
      },
      (error) => {
        // Erreur de scan (on peut ignorer les erreurs de scan continues)
        console.log('Erreur de scan:', error);
      }
    );
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const validateQRCode = async (qrCode) => {
    try {
      const response = await tableService.validateQR(qrCode);
      
      if (response.table) {
        setValidatedTable(response.table);
        toast.success(`Table ${response.table.numero} validée avec succès!`);
        
        // Stocker les informations de la table dans le localStorage
        localStorage.setItem('currentTable', JSON.stringify(response.table));
        
        // Rediriger vers le menu après 2 secondes
        setTimeout(() => {
          navigate('/menu');
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'QR code invalide';
      setError(message);
      toast.error(message);
    }
  };

  const handleManualInput = () => {
    // Pour les tests, on peut permettre la saisie manuelle
    const tableId = prompt('Entrez l\'ID de la table pour les tests:');
    if (tableId) {
      validateQRCode(JSON.stringify({
        type: 'table',
        tableId: tableId,
        tableNumber: tableId,
        timestamp: Date.now()
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <QrCode className="h-16 w-16 mx-auto text-orange-600 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Scanner QR Code</h1>
        <p className="text-muted-foreground">
          Scannez le code QR de votre table pour commencer votre commande
        </p>
      </div>

      {!isScanning && !validatedTable && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Prêt à scanner</CardTitle>
            <CardDescription>
              Cliquez sur le bouton ci-dessous pour activer la caméra et scanner le QR code de votre table
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button 
              onClick={startScanning} 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Camera className="mr-2 h-5 w-5" />
              Démarrer le scan
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>Assurez-vous que:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Votre caméra fonctionne correctement</li>
                <li>Le QR code est bien visible et éclairé</li>
                <li>Vous tenez votre appareil stable</li>
              </ul>
            </div>

            {/* Bouton pour les tests */}
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleManualInput}
                className="text-xs"
              >
                Mode test (saisie manuelle)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isScanning && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Scan en cours...</CardTitle>
            <CardDescription>
              Pointez votre caméra vers le QR code de la table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div id="qr-reader" className="w-full"></div>
            <div className="text-center mt-4">
              <Button variant="outline" onClick={stopScanning}>
                Arrêter le scan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validatedTable && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Table {validatedTable.numero} validée!</strong>
            <br />
            Capacité: {validatedTable.capacite} personnes
            <br />
            Redirection vers le menu en cours...
          </AlertDescription>
        </Alert>
      )}

      {scanResult && !validatedTable && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat du scan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm break-all">{scanResult}</code>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Validation en cours...
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ol className="list-decimal list-inside space-y-2">
            <li>Trouvez le QR code sur votre table</li>
            <li>Cliquez sur "Démarrer le scan"</li>
            <li>Autorisez l'accès à votre caméra</li>
            <li>Pointez la caméra vers le QR code</li>
            <li>Attendez la validation automatique</li>
            <li>Vous serez redirigé vers le menu</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;

