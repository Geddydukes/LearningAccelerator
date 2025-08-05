import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingActions, syncing } = useOfflineSync();

  return (
    <AnimatePresence>
      {(!isOnline || pendingActions > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
            isOnline 
              ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200' 
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`}>
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            
            <span className="text-sm font-medium">
              {syncing 
                ? 'Syncing...'
                : isOnline 
                ? `${pendingActions} pending sync${pendingActions !== 1 ? 's' : ''}`
                : 'Offline'
              }
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};