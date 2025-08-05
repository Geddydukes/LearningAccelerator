import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, History, Settings } from 'lucide-react';
import { useRealTimeUpdates, useWeeklyNotesUpdates } from '../../hooks/useRealTimeUpdates';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useSubscription } from '../../hooks/useSubscription';
import { FeatureGate, UsageLimit } from './SubscriptionBadge';
import { OfflineIndicator } from '../ui/OfflineIndicator';
import { SkeletonCard } from '../ui/LoadingSpinner';
import { useDatabase } from '../../hooks/useDatabase';
import { DatabaseService } from '../../lib/database';
import { AgentOrchestrator } from '../../lib/agents';
import { AgentCard } from './AgentCard';
import { WeeklyProgress } from './WeeklyProgress';
import { AgentModal } from '../agents/AgentModal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AgentStatus } from '../../types';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { user, currentWeek, loading, createOrUpdateWeek } = useDatabase();
  const { isPaid, hasFeature } = useSubscription();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [userWeeks, setUserWeeks] = useState<number>(0);
  const agentOperation = useAsyncOperation({
    showToast: true,
    onSuccess: () => {
      // Refresh data after successful agent interaction
      window.location.reload();
    }
  });
  const [agents, setAgents] = useState<AgentStatus[]>([
    {
      name: 'CLO - Curriculum Architect',
      status: 'idle',
      last_interaction: '2 hours ago',
      progress: 0
    },
    {
      name: 'Socratic Inquisitor',
      status: 'idle',
      last_interaction: 'Never',
      progress: 0
    },
    {
      name: 'Alex - Lead Engineer',
      status: 'idle',
      last_interaction: 'Never',
      progress: 0
    },
    {
      name: 'Brand Strategist',
      status: 'idle',
      last_interaction: 'Never',
      progress: 0
    }
  ]);

  // Real-time updates for weekly notes
  useWeeklyNotesUpdates((updatedNote) => {
    // Update local state when weekly notes change
    console.log('Weekly note updated:', updatedNote);
  });

  // Update agent status based on current week data
  useEffect(() => {
    // Load user weeks count
    if (user) {
      DatabaseService.getUserWeeks(user.id).then(weeks => {
        setUserWeeks(weeks.length);
      });
    }
    
    if (currentWeek?.completion_status) {
      const { completion_status } = currentWeek;
      setAgents(prev => prev.map(agent => {
        let completed = false;
        switch (agent.name) {
          case 'CLO - Curriculum Architect':
            completed = completion_status.clo_completed;
            break;
          case 'Socratic Inquisitor':
            completed = completion_status.socratic_completed;
            break;
          case 'Alex - Lead Engineer':
            completed = completion_status.alex_completed;
            break;
          case 'Brand Strategist':
            completed = completion_status.brand_completed;
            break;
        }
        
        return {
          ...agent,
          status: agentOperation.loading ? 'processing' : completed ? 'completed' : 'idle',
          progress: completed ? 100 : agentOperation.loading ? 50 : 0,
          last_interaction: completed ? 'Recently' : 'Never'
        };
      }));
    }
  }, [currentWeek, agentOperation.loading]);

  const handleAgentInteraction = async (agentName: string) => {
    if (!user) return;
    
    // Navigate to appropriate workflow page
    switch (agentName) {
      case 'CLO - Curriculum Architect':
        navigate('/clo');
        break;
      case 'Socratic Inquisitor':
        navigate('/socratic');
        break;
      case 'Alex - Lead Engineer':
        setSelectedAgent(agentName);
        break;
      case 'Brand Strategist':
        setSelectedAgent(agentName);
        break;
      default:
        toast.error(`Unknown agent: ${agentName}`);
    }
  };

  const handleOpenModal = (agentName: string) => {
    setSelectedAgent(agentName);
  };

  const handleCloseModal = () => {
    setSelectedAgent(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <SkeletonCard />
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfflineIndicator />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Learning Dashboard
                {isPaid() && (
                  <span className="ml-3 text-lg text-emerald-600 dark:text-emerald-400">
                    Pro Features Enabled
                  </span>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Orchestrate your multi-agent learning experience
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Week
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Progress */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <WeeklyProgress
              weekNumber={1}
              completionStatus={currentWeek?.completion_status || {
                clo_completed: false,
                socratic_completed: false,
                alex_completed: false,
                brand_completed: false,
                overall_progress: 0
              }}
              estimatedTimeRemaining={8}
              userWeeks={userWeeks}
            />
          </motion.div>

          {/* Agent Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <AgentCard
                    agent={agent}
                    onInteract={() => handleAgentInteraction(agent.name)}
                    onOpenModal={() => handleOpenModal(agent.name)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions {isPaid() && <span className="text-sm text-emerald-600">(Pro)</span>}
            </h3>
            
            {/* Usage limits for Pro users */}
            {isPaid() && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <UsageLimit
                  limitType="socratic_messages"
                  currentUsage={0}
                  label="Socratic Messages"
                />
                <UsageLimit
                  limitType="code_reviews"
                  currentUsage={0}
                  label="Code Reviews"
                />
                <UsageLimit
                  limitType="voice_synthesis"
                  currentUsage={0}
                  label="Voice Synthesis"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <History className="w-4 h-4 mr-2" />
                View Learning History
              </Button>
              
              <FeatureGate 
                feature="advanced_analytics"
                fallback={
                  <Button variant="outline" className="justify-start opacity-50" disabled>
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Settings (Pro)
                  </Button>
                }
              >
                <Button variant="outline" className="justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Settings
                </Button>
              </FeatureGate>
              
              <FeatureGate 
                feature="unlimited_sessions"
                fallback={
                  <Button variant="outline" className="justify-start opacity-50" disabled>
                    <Plus className="w-4 h-4 mr-2" />
                    Unlimited Modules (Pro)
                  </Button>
                }
              >
                <Button variant="outline" className="justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Module
                </Button>
              </FeatureGate>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Agent Modal */}
      <AgentModal
        isOpen={!!selectedAgent}
        onClose={handleCloseModal}
        agentName={selectedAgent || ''}
      />
    </div>
  );
};