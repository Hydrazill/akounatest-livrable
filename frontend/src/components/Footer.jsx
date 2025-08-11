import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground/40 text-primary-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 akounamatata-text-gradient">
              FoodHive
            </h3>
            <p className="text-primary-foreground/80 mb-4">
              Révolutionner l'expérience culinaire. <br /> 
              Découvrez nos saveurs authentiques dans une ambiance afro-contemporaine.
            </p>
            <p className="text-sm text-primary-foreground/60">
              © 2025 FoodHive. Tous droits réservés.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/menu" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Notre Menu
                </Link>
              </li>
              {/* <li>
                <Link 
                  to="/favorites" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Favoris
                </Link>
              </li> */}
              {/* <li>
                <Link 
                  to="/orders" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Historique
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li className='flex'> <MapPin className='h-6 w-6 mr-2' />  Yaounde, Cameroun</li>
              <li>📞 +237 673 11 52 33</li>
              <li>✉️ eranistechnology@gmail.com</li>
            </ul>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-primary-foreground/60 mb-4 md:mb-0">
              Fait avec <Heart className="inline h-4 w-4 text-red-400" /> par l'équipe Eranis
            </p>
            <div className="flex space-x-4 text-sm">
              {/* <a 
                href="#" 
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Politique de confidentialité
              </a> */}
              {/* <a 
                href="#" 
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Conditions d'utilisation
              </a> */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

