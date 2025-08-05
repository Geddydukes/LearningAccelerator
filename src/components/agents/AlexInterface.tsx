import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Github, Search, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { AgentOrchestrator } from '../../lib/agents';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ProgressBar } from '../ui/ProgressBar';
import toast from 'react-hot-toast';

export const AlexInterface: React.FC = () => {
  const { user } = useDatabase();
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [depth, setDepth] = useState<'RAPID' | 'STANDARD' | 'DEEP_DIVE'>('STANDARD');
  const [reviewData, setReviewData] = useState(null);
  const [dossierSubmitted, setDossierSubmitted] = useState(false);

  const alexOperation = useAsyncOperation({
    showToast: false,
    onSuccess: (data) => {
      if (data.text_response) {
        // Alex is asking for something (like dossier)
        toast.info(data.text_response);
      } else {
        // Alex returned review data
        setReviewData(data);
        toast.success('Code review completed!');
      }
    }
  });

  const handleSubmitDossier = async () => {
    if (!user || !repositoryUrl.trim()) {
      toast.error('Please enter a repository URL');
      return;
    }
    
    const currentWeekNumber = Math.ceil(
      (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    await alexOperation.execute(async () => {
      const result = await AgentOrchestrator.callAlexAgent(
        user.id,
        `SUBMIT_DOSSIER\nRepository: ${repositoryUrl}\nDepth: ${depth}`,
        currentWeekNumber
      );
      
      if (result.success) {
        setDossierSubmitted(true);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const handleSetDepth = async (newDepth: 'RAPID' | 'STANDARD' | 'DEEP_DIVE') => {
    if (!user) return;
    
    setDepth(newDepth);
    
    const currentWeekNumber = Math.ceil(
      (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    await alexOperation.execute(async () => {
      const result = await AgentOrchestrator.callAlexAgent(
        user.id,
        `SET_DEPTH: ${newDepth}`,
        currentWeekNumber
      );
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const getDepthDescription = (depthLevel: string) => {
    switch (depthLevel) {
      case 'RAPID':
        return 'Quick overview (≤400 tokens)';
      case 'STANDARD':
        return 'Comprehensive review (≤800 tokens)';
      case 'DEEP_DIVE':
        return 'Detailed analysis with metrics (≤1100 tokens)';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Code className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Alex - Lead Engineer Advisor
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Strategic technical analysis and code review
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!dossierSubmitted && !reviewData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Submit Project Dossier
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repository URL
                  </label>
                  <Input
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    icon={<Github className="w-5 h-5" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Review Depth
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['RAPID', 'STANDARD', 'DEEP_DIVE'] as const).map((depthOption) => (
                      <button
                        key={depthOption}
                        onClick={() => setDepth(depthOption)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          depth === depthOption
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="font-medium">{depthOption}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getDepthDescription(depthOption)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleSubmitDossier}
                  loading={alexOperation.loading}
                  disabled={!repositoryUrl.trim()}
                  className="w-full"
                >
                  <Search className="w-4 h-4 mr-2" />
                  SUBMIT_DOSSIER
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {reviewData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                Code Review Results
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Quality Score:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {reviewData.code_quality_score || 0}/100
                </span>
              </div>
            </div>

            {reviewData.code_quality_score && (
              <ProgressBar 
                progress={reviewData.code_quality_score}
                color={reviewData.code_quality_score >= 80 ? 'emerald' : reviewData.code_quality_score >= 60 ? 'amber' : 'red'}
              />
            )}

            {reviewData.analysis_summary && (
              <Card className="p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Analysis Summary
                </h5>
                <p className="text-gray-700 dark:text-gray-300">
                  {reviewData.analysis_summary}
                </p>
              </Card>
            )}

            {reviewData.recommendations && reviewData.recommendations.length > 0 && (
              <Card className="p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Recommendations
                </h5>
                <div className="space-y-3">
                  {reviewData.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {rec.category || 'Recommendation'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {rec.description || rec}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {reviewData.best_practices_followed && reviewData.best_practices_followed.length > 0 && (
              <Card className="p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Best Practices Followed
                </h5>
                <div className="space-y-2">
                  {reviewData.best_practices_followed.map((practice, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{practice}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {reviewData.areas_for_improvement && reviewData.areas_for_improvement.length > 0 && (
              <Card className="p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Areas for Improvement
                </h5>
                <div className="space-y-2">
                  {reviewData.areas_for_improvement.map((area, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{area}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button 
                  onClick={() => {
                    setReviewData(null);
                    setDossierSubmitted(false);
                    setRepositoryUrl('');
                  }}
                  variant="outline"
                >
                  New Review
                </Button>
                <Button 
                  onClick={() => handleSetDepth('DEEP_DIVE')}
                  loading={alexOperation.loading}
                  disabled={depth === 'DEEP_DIVE'}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Deep Dive Analysis
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};