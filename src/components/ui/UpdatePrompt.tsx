import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '../../hooks/usePWA';
import { Button } from './Button';
import { Card } from './Card';

export const UpdatePrompt: React.FC = () => {
  const { updateAvailable, updateApp } = useServiceWorker();
  const [dismissed, setDismissed] = React.useState(false);

  const handleUpdate = () => {
    updateApp();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {updateAvailable && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <Card className="p-4 shadow-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Update Available
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  A new version is ready to install
                </p>
                
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    className="flex items-center text-xs bg-emerald-600 hover:bg-emerald-700"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Update Now
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs text-emerald-700 hover:text-emerald-800"
                  >
                    Later
                  </Button>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="p-1 h-auto flex-shrink-0 text-emerald-600 hover:text-emerald-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};