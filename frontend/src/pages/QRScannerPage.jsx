import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Camera, AlertCircle, CheckCircle, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import QrScanner from 'qr-scanner';

const QRScannerPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const navigate = useNavigate();

  // Callback pour gérer le résultat du scan
  const handleScanResult = useCallback((result) => {
    setScanResult(result.data);
    setIsScanning(false);
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    // Utilisation du toast pour informer l'utilisateur et redirection
    toast.success("Redirection en cours vers l'adresse scannée !");
    // Redirige vers l'adresse du QR code après 1 seconde
    setTimeout(() => {
      // Si c'est une URL valide avec http(s), utilise window.location
      if (/^https?:\/\//i.test(result.data)) {
        window.location.href = result.data;
      } else {
        // Sinon, tente une navigation interne (peut adapter selon ton routage)
        navigate(result.data);
      }
    }, 1000);
  }, [navigate]);

  useEffect(() => {
    if (isScanning && videoRef.current) {
      setError(null);
      setScanResult(null);
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      const qrScanner = new QrScanner(
        videoRef.current,
        handleScanResult,
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      );
      qrScannerRef.current = qrScanner;
      qrScanner.start().catch(() => {
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        setIsScanning(false);
      });
    }
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [isScanning, handleScanResult]);

  const startScanning = () => {
    setError(null);
    setScanResult(null);
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Pour tester sans caméra
  const simulateQRScan = () => {
    // Pour la démo, simule une URL
    handleScanResult({ data: "https://www.example.com" });
  };

  const handleManualInput = () => {
    const message = prompt('Entrez le message à simuler comme QR code (une URL pour tester la redirection):');
    if (message) handleScanResult({ data: message });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <QrCode className="h-16 w-16 mx-auto text-orange-600 mb-4" />
        <h1 className="text-3xl font-bold mb-2 foodHive-text-gradient">Scanner QR Code</h1>
        <p className="text-primary-foreground">
          Scannez un code QR pour être automatiquement redirigé vers l'adresse contenue
        </p>
      </div>

      {!isScanning && !scanResult && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Prêt à scanner</CardTitle>
            <CardDescription className="text-sm text-foreground">
              Cliquez sur le bouton ci-dessous pour activer la caméra et scanner un QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-3">
              <Button
                onClick={startScanning}
                size="lg"
                className="foodHive-button-primary hover:bg-orange-700 w-full"
              >
                <Camera className="mr-2 h-5 w-5" />
                Démarrer le scan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isScanning && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Scan en cours...</CardTitle>
            <CardDescription className="text-sm text-foreground">
              Pointez votre caméra vers le QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 border-2 border-orange-500 rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg"></div>
              </div>
            </div>
            <div className="text-center mt-4 space-y-2">
              <p className="text-sm text-foreground">
                Placez le QR code dans le cadre blanc
              </p>
              <Button variant="outline" onClick={stopScanning} className="text-sm text-primary-foreground">
                <StopCircle className="mr-2 h-4 w-4" />
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

      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Adresse scannée</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-foreground">
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm break-all">{scanResult}</code>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Redirection en cours...
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
            <li>Trouvez un QR code contenant une adresse web ou une route</li>
            <li>Cliquez sur "Démarrer le scan"</li>
            <li>Autorisez l'accès à votre caméra</li>
            <li>Pointez la caméra vers le QR code</li>
            <li>Vous serez informé puis redirigé automatiquement</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScannerPage;