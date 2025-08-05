import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Target, Trophy, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { CompletionStatus } from '../../types';

interface WeeklyProgressProps {
  weekNumber: number;
  completionStatus: CompletionStatus;
  estimatedTimeRemaining: number;
  userWeeks: number;
}

export const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  weekNumber,
  completionStatus,
  estimatedTimeRemaining,
  userWeeks
}) => {
  const completedTasks = [
    completionStatus.clo_completed,
    completionStatus.socratic_completed,
    completionStatus.alex_completed,
    completionStatus.brand_completed
  ].filter(Boolean).length;

  const totalTasks = 4;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Week {weekNumber} {userWeeks > 0 && `(${userWeeks} completed)`}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Learning Progress
            </p>
          </div>
        </div>
        
        {completionStatus.overall_progress === 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center"
          >
            <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
        )}
      </div>

      <div className="space-y-4">
        <ProgressBar 
          progress={completionStatus.overall_progress}
          color="emerald"
          className="mb-4"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Tasks Completed
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {completedTasks}/{totalTasks}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Time Remaining
              </p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {estimatedTimeRemaining}h
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Agent Status
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={`flex items-center space-x-2 ${completionStatus.clo_completed ? 'text-emerald-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${completionStatus.clo_completed ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span>CLO</span>
            </div>
            <div className={`flex items-center space-x-2 ${completionStatus.socratic_completed ? 'text-emerald-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${completionStatus.socratic_completed ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span>Socratic</span>
            </div>
            <div className={`flex items-center space-x-2 ${completionStatus.alex_completed ? 'text-emerald-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${completionStatus.alex_completed ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span>Alex</span>
            </div>
            <div className={`flex items-center space-x-2 ${completionStatus.brand_completed ? 'text-emerald-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${completionStatus.brand_completed ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span>Brand</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};