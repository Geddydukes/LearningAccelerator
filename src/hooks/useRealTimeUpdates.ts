import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RealtimeSubscription {
  channel: string;
  table: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export const useRealTimeUpdates = (subscriptions: RealtimeSubscription[]) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channels = subscriptions.map(sub => {
      const channel = supabase
        .channel(sub.channel)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: sub.table,
            filter: sub.filter || `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time update:', payload);
            
            switch (payload.eventType) {
              case 'INSERT':
                sub.onInsert?.(payload.new);
                break;
              case 'UPDATE':
                sub.onUpdate?.(payload.new);
                break;
              case 'DELETE':
                sub.onDelete?.(payload.old);
                break;
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            toast.error('Lost connection to real-time updates');
          }
        });

      return channel;
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setIsConnected(false);
    };
  }, [user, subscriptions]);

  return { isConnected };
};

// Specialized hook for weekly notes updates
export const useWeeklyNotesUpdates = (onUpdate: (note: any) => void) => {
  return useRealTimeUpdates([
    {
      channel: 'weekly-notes-updates',
      table: 'weekly_notes',
      onUpdate: (payload) => {
        onUpdate(payload);
        toast.success('Learning progress updated!');
      }
    }
  ]);
};

// Hook for Socratic session updates
export const useSocraticUpdates = (sessionId: string, onNewMessage: (message: any) => void) => {
  return useRealTimeUpdates([
    {
      channel: 'socratic-messages',
      table: 'messages',
      filter: `session_id=eq.${sessionId}`,
      onInsert: (payload) => {
        if (payload.role === 'assistant') {
          onNewMessage(payload);
        }
      }
    }
  ]);
};