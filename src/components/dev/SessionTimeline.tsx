import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { GlassCard } from '../design-system/GlassCard';

interface AgentEvent {
  id: string;
  correlation_id: string;
  user_id: string;
  agent: string;
  tool: string;
  started_at: string;
  ended_at: string | null;
  tokens_in: number;
  tokens_out: number;
  status: 'running' | 'completed' | 'failed';
  cost_estimate: number;
  error_message: string | null;
}

interface SessionTimelineProps {
  correlationId: string;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({ correlationId }) => {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [correlationId]);

  const fetchEvents = async () => {
    try {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('agent_events')
        .select('*')
        .eq('correlation_id', correlationId)
        .order('started_at', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDuration = (startedAt: string, endedAt: string | null) => {
    if (!endedAt) return 'Running...';
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const duration = end.getTime() - start.getTime();
    return `${duration}ms`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTotalCost = () => {
    return events.reduce((sum, event) => sum + (event.cost_estimate || 0), 0);
  };

  const getTotalTokens = () => {
    const tokensIn = events.reduce((sum, event) => sum + (event.tokens_in || 0), 0);
    const tokensOut = events.reduce((sum, event) => sum + (event.tokens_out || 0), 0);
    return { in: tokensIn, out: tokensOut };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading session timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">Error loading timeline</div>
        <div className="text-sm text-gray-600">{error}</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-600">No events found for correlation ID: {correlationId}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Session Timeline</h1>
        <p className="text-gray-600">Correlation ID: <code className="bg-gray-100 px-2 py-1 rounded">{correlationId}</code></p>
      </div>

      {/* Summary Stats */}
      <GlassCard className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{events.length}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {getTotalTokens().in + getTotalTokens().out}
            </div>
            <div className="text-sm text-gray-600">Total Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${getTotalCost().toFixed(4)}
            </div>
            <div className="text-sm text-gray-600">Total Cost</div>
          </div>
        </div>
      </GlassCard>

      {/* Timeline */}
      <div className="space-y-4">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(event.status)}`}>
                      {event.status.toUpperCase()}
                    </span>
                    <span className="text-lg font-semibold">{event.agent}</span>
                    <span className="text-sm text-gray-600">→ {event.tool}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Duration</div>
                      <div className="font-mono">{getDuration(event.started_at, event.ended_at)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Tokens In</div>
                      <div className="font-mono">{event.tokens_in}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Tokens Out</div>
                      <div className="font-mono">{event.tokens_out}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost</div>
                      <div className="font-mono">${event.cost_estimate.toFixed(4)}</div>
                    </div>
                  </div>

                  {event.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <div className="text-sm text-red-800">
                        <strong>Error:</strong> {event.error_message}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500">
                    Started: {new Date(event.started_at).toLocaleString()}
                    {event.ended_at && (
                      <> • Ended: {new Date(event.ended_at).toLocaleString()}</>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Timeline Visualization */}
      <GlassCard className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Timeline Visualization</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
          {events.map((event, index) => (
            <div key={event.id} className="relative flex items-center mb-4">
              <div className="absolute left-3 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
              <div className="ml-8">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{event.agent}</span>
                  <span className="text-sm text-gray-600">→ {event.tool}</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {getDuration(event.started_at, event.ended_at)} • 
                  {event.tokens_in + event.tokens_out} tokens • 
                  ${event.cost_estimate.toFixed(4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
