import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, MessageCircle, Code, TrendingUp } from 'lucide-react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SocraticChat } from './SocraticChat';
import { CLOInterface } from './CLOInterface';
import { AlexInterface } from './AlexInterface';
import { BrandInterface } from './BrandInterface';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
}

const agentIcons = {
  'CLO - Curriculum Architect': GraduationCap,
  'Socratic Inquisitor': MessageCircle,
  'Alex - Lead Engineer': Code,
  'Brand Strategist': TrendingUp,
};

export const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, agentName }) => {
  const Icon = agentIcons[agentName as keyof typeof agentIcons] || GraduationCap;

  const renderAgentContent = () => {
    switch (agentName) {
      case 'Socratic Inquisitor':
        return (
          <ErrorBoundary fallback={
            <div className="p-6 text-center">
              <p className="text-red-600">Failed to load Socratic chat</p>
            </div>
          }>
            <SocraticChat />
          </ErrorBoundary>
        );
      case 'CLO - Curriculum Architect':
        return (
          <ErrorBoundary fallback={
            <div className="p-6 text-center">
              <p className="text-red-600">Failed to load CLO interface</p>
            </div>
          }>
            <CLOInterface />
          </ErrorBoundary>
        );
      case 'Alex - Lead Engineer':
        return (
          <ErrorBoundary fallback={
            <div className="p-6 text-center">
              <p className="text-red-600">Failed to load Alex interface</p>
            </div>
          }>
            <AlexInterface />
          </ErrorBoundary>
        );
      case 'Brand Strategist':
        return (
          <ErrorBoundary fallback={
            <div className="p-6 text-center">
              <p className="text-red-600">Failed to load Brand interface</p>
            </div>
          }>
            <BrandInterface />
          </ErrorBoundary>
        );
      default:
        return (
          <div className="p-6">
            <LoadingSpinner 
              variant="dots" 
              message="Agent interface not available" 
            />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
          >
            <Card className="h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {agentName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Interactive Agent Session
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {renderAgentContent()}
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};