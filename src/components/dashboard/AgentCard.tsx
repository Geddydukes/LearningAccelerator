import React from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  MessageCircle, 
  Code, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { AgentStatus } from '../../types';

interface AgentCardProps {
  agent: AgentStatus;
  onInteract: () => void;
  onOpenModal?: () => void;
}

const agentIcons = {
  'CLO - Curriculum Architect': GraduationCap,
  'Socratic Inquisitor': MessageCircle,
  'Alex - Lead Engineer': Code,
  'Brand Strategist': TrendingUp,
};

const statusColors = {
  idle: 'gray',
  processing: 'amber',
  completed: 'emerald',
  error: 'red',
} as const;

const statusIcons = {
  idle: Clock,
  processing: Loader,
  completed: CheckCircle,
  error: AlertCircle,
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onInteract, onOpenModal }) => {
  const Icon = agentIcons[agent.name as keyof typeof agentIcons] || GraduationCap;
  const StatusIcon = statusIcons[agent.status];
  const statusColor = statusColors[agent.status];

  return (
    <Card hover className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-emerald-500`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {agent.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <StatusIcon 
                className={`w-4 h-4 ${
                  statusColor === 'gray' ? 'text-gray-500' :
                  statusColor === 'amber' ? 'text-amber-500 animate-spin' :
                  statusColor === 'emerald' ? 'text-emerald-500' :
                  'text-red-500'
                }`} 
              />
              <span className={`text-sm capitalize ${
                statusColor === 'gray' ? 'text-gray-500' :
                statusColor === 'amber' ? 'text-amber-600' :
                statusColor === 'emerald' ? 'text-emerald-600' :
                'text-red-600'
              }`}>
                {agent.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProgressBar 
        progress={agent.progress} 
        color={statusColor === 'gray' ? 'blue' : statusColor}
        className="mb-4"
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Last: {agent.last_interaction}
        </span>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={onInteract}
            disabled={agent.status === 'processing'}
            variant={agent.status === 'completed' ? 'outline' : 'primary'}
          >
            {agent.status === 'completed' ? 'Review' : 'Start'}
          </Button>
          {onOpenModal && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenModal}
              disabled={agent.status === 'processing'}
            >
              Open
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};