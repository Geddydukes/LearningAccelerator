import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle, Clock, Target } from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { AgentOrchestrator } from '../../lib/agents';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { CollapsibleMarkdown, LearningObjectives, KeyConcepts, Resources } from '../ui/CollapsibleMarkdown';
import toast from 'react-hot-toast';

export const CLOInterface: React.FC = () => {
  const { user, currentWeek } = useDatabase();
  const [userInput, setUserInput] = useState('');
  const [hasAgreedParams, setHasAgreedParams] = useState(false);
  const [moduleData, setModuleData] = useState(null);

  const cloOperation = useAsyncOperation({
    showToast: false,
    onSuccess: (data) => {
      if (data.text_response) {
        // CLO is asking for something (like AGREE_PARAMS)
        toast.info(data.text_response);
      } else {
        // CLO returned module data
        setModuleData(data);
        toast.success('Learning module generated!');
      }
    }
  });

  const handleAgreeParams = async () => {
    if (!user) return;
    
    const currentWeekNumber = Math.ceil(
      (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    await cloOperation.execute(async () => {
      const result = await AgentOrchestrator.callCLOAgent(
        user.id,
        'AGREE_PARAMS',
        currentWeekNumber
      );
      
      if (result.success) {
        setHasAgreedParams(true);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const handleBeginWeek = async () => {
    if (!user) return;
    
    const currentWeekNumber = Math.ceil(
      (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    await cloOperation.execute(async () => {
      const result = await AgentOrchestrator.callCLOAgent(
        user.id,
        'BEGIN_WEEK',
        currentWeekNumber
      );
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const handleCustomInput = async () => {
    if (!user || !userInput.trim()) return;
    
    const currentWeekNumber = Math.ceil(
      (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    await cloOperation.execute(async () => {
      const result = await AgentOrchestrator.callCLOAgent(
        user.id,
        userInput,
        currentWeekNumber
      );
      
      if (result.success) {
        setUserInput('');
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              CLO - Curriculum Architect
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate personalized learning modules
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!hasAgreedParams && !moduleData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Learning Parameters
              </h4>
              <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Time investment: 15-20 hours per week</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Theory 30%, Practice 40%, Project 30%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Budget guidance: Optional paid resources ≤ $75</span>
                </div>
              </div>
              <Button 
                onClick={handleAgreeParams}
                loading={cloOperation.loading}
                className="mt-4 w-full"
              >
                Agree
              </Button>
            </Card>
          </motion.div>
        )}

        {hasAgreedParams && !moduleData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ready to Generate Your Learning Module
              </h4>
              <Button 
                onClick={handleBeginWeek}
                loading={cloOperation.loading}
                size="lg"
                className="mb-6"
              >
                <Play className="w-5 h-5 mr-2" />
                BEGIN_WEEK
              </Button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                Or send a custom command:
              </h5>
              <div className="flex space-x-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter CLO command (e.g., SHOW_PARAMS, META_REFLECTION)"
                  className="flex-1"
                />
                <Button 
                  onClick={handleCustomInput}
                  disabled={!userInput.trim()}
                  loading={cloOperation.loading}
                >
                  Send
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {moduleData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                {moduleData.module_title || 'Learning Module'}
              </h4>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{moduleData.estimated_duration || 120} minutes</span>
              </div>
            </div>

            {moduleData.learning_objectives && (
              <LearningObjectives 
                objectives={moduleData.learning_objectives}
                defaultOpen={true}
              />
            )}

            {moduleData.key_concepts && (
              <KeyConcepts 
                concepts={moduleData.key_concepts}
                defaultOpen={false}
              />
            )}

            {moduleData.resources && (
              <Resources 
                resources={moduleData.resources}
                defaultOpen={false}
              />
            )}

            {/* Intentionally hide any sections below Resources (e.g., daily prompts, TA/Socratic prompts, assessment, internal notes) */}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                onClick={() => {
                  setModuleData(null);
                  setHasAgreedParams(false);
                }}
                variant="outline"
                className="mr-3"
              >
                Generate New Module
              </Button>
              <Button onClick={handleBeginWeek} loading={cloOperation.loading}>
                Regenerate Current Week
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};