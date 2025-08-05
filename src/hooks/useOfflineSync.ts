import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Changes will be synced when connection is restored.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending actions from localStorage
    const stored = localStorage.getItem('offline-actions');
    if (stored) {
      setPendingActions(JSON.parse(stored));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Save pending actions to localStorage
    localStorage.setItem('offline-actions', JSON.stringify(pendingActions));
  }, [pendingActions]);

  const queueAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    setPendingActions(prev => [...prev, newAction]);

    if (isOnline) {
      syncPendingActions();
    } else {
      toast.info('Action queued for when you\'re back online');
    }
  }, [isOnline]);

  const syncPendingActions = useCallback(async () => {
    if (pendingActions.length === 0 || syncing) return;

    setSyncing(true);
    const successfulActions: string[] = [];

    try {
      for (const action of pendingActions) {
        try {
          switch (action.type) {
            case 'create':
              await supabase.from(action.table).insert(action.data);
              break;
            case 'update':
              await supabase.from(action.table).update(action.data).eq('id', action.data.id);
              break;
            case 'delete':
              await supabase.from(action.table).delete().eq('id', action.data.id);
              break;
          }
          successfulActions.push(action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }

      // Remove successful actions
      setPendingActions(prev => 
        prev.filter(action => !successfulActions.includes(action.id))
      );

      if (successfulActions.length > 0) {
        toast.success(`Synced ${successfulActions.length} offline changes`);
      }

    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync some offline changes');
    } finally {
      setSyncing(false);
    }
  }, [pendingActions, syncing]);

  return {
    isOnline,
    pendingActions: pendingActions.length,
    syncing,
    queueAction,
    syncPendingActions
  };
};