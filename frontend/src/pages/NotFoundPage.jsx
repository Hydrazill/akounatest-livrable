import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

const NotFoundPage = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Illustration 404 */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold foodHive-text-gradient mb-4">
            404
          </h1>
          <div className="text-6xl mb-4">🍽️</div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">
            Oups ! Page introuvable
          </h2>
          <p className="text-primary-foreground mb-6">
            La page que vous recherchez semble avoir été déplacée ou n'existe plus. 
            Peut-être qu'elle a été mangée ? 🤔
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="foodHive-button-primary">
              {user?.role === 'admin' ? (
                <Link to="/admin">
                  <Home className="mr-2 h-4 w-4" />
                  Retour au menu
                </Link>
              ) : user?.role === 'gestionnaire' ? (
                <Link to="/gestionnaire">
                  <Home className="mr-2 h-4 w-4" />
                  Retour au menu
                </Link>
              ) : (
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Retour au menu
                </Link>
              )
            }
            </Button>
            
            <Button variant="outline" onClick={() => window.history.back()} className="text-sm text-primary-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Page précédente
            </Button>
          </div>

          <p className="text-sm text-primary-foreground">
            Ou explorez notre délicieux{' '}
            <Link to="/menu" className="text-primary hover:underline">
              menu du jour
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;

