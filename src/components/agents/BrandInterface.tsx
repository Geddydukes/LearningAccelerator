import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Users, BarChart3, FileText, Download } from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { AgentOrchestrator } from '../../lib/agents';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { SocialContentGrid } from '../brand/SocialCard';
import { KPIGrid } from '../analytics/KPITrend';
import toast from 'react-hot-toast';

export const BrandInterface: React.FC = () => {
  const { user, currentWeek } = useDatabase();
  const [businessContext, setBusinessContext] = useState('');
  const [personalReflection, setPersonalReflection] = useState('');
  const [mode, setMode] = useState<'LITE' | 'STANDARD' | 'SIGNATURE'>('STANDARD');
  const [strategyData, setStrategyData] = useState(null);
  const [briefingSubmitted, setBriefingSubmitted] = useState(false);

  const brandOperation = useAsyncOperation({
    showToast: false,
    onSuccess: (data) => {
      if (data.text_response) {
        // Brand is asking for briefing
        toast.info(data.text_response);
      } else {
        // Brand returned strategy package
        setStrategyData(data);
        toast.success('Brand strategy package generated!');
      }
    }
  });

  const handleSubmitBriefing = async () => {
    if (!user) return;
    
    const currentWeekNumber = Math.ceil(
      (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    await brandOperation.execute(async () => {
      const result = await AgentOrchestrator.callBrandAgent(
        user.id,
        `SUBMIT_BRIEFING\nBusiness Context: ${businessContext}\nPersonal Reflection: ${personalReflection}\nMode: ${mode}`,
        currentWeekNumber,
        personalReflection
      );
      
      if (result.success) {
        setBriefingSubmitted(true);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const handleSetMode = async (newMode: 'LITE' | 'STANDARD' | 'SIGNATURE') => {
    setMode(newMode);
    
    if (!user) return;
    
    const currentWeekNumber = Math.ceil(
      (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    await brandOperation.execute(async () => {
      const result = await AgentOrchestrator.callBrandAgent(
        user.id,
        `SET_MODE: ${newMode}`,
        currentWeekNumber
      );
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const getModeDescription = (modeLevel: string) => {
    switch (modeLevel) {
      case 'LITE':
        return '1 LinkedIn post, 1 tweet (≤400 tokens)';
      case 'STANDARD':
        return '3 posts + KPI snapshot (≤650 tokens)';
      case 'SIGNATURE':
        return 'Full package + blog + analytics (≤900 tokens)';
      default:
        return '';
    }
  };

  const mockSocialContent = strategyData?.social_content_suggestions?.map(suggestion => ({
    platform: suggestion.platform,
    content: {
      title: suggestion.title,
      body: suggestion.description,
      estimatedEngagement: suggestion.estimated_engagement || 50,
      tags: strategyData.content_themes?.slice(0, 3) || []
    }
  })) || [];

  const mockKPIMetrics = strategyData?.kpi_metrics?.map(metric => ({
    name: metric.name,
    current: metric.current_value,
    target: metric.target_value,
    trend: metric.trend,
    change: metric.current_value - (metric.target_value * 0.8), // Mock previous value
    unit: metric.unit
  })) || [];

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Brand Strategist
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Content strategy and brand development
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!briefingSubmitted && !strategyData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Weekly Intelligence Briefing
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Context
                  </label>
                  <textarea
                    value={businessContext}
                    onChange={(e) => setBusinessContext(e.target.value)}
                    placeholder="Describe your business, industry, and current goals..."
                    className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Personal Reflection (≤150 words)
                  </label>
                  <textarea
                    value={personalReflection}
                    onChange={(e) => setPersonalReflection(e.target.value)}
                    placeholder="Reflect on your learning progress this week..."
                    className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={150}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {personalReflection.length}/150 characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Content Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['LITE', 'STANDARD', 'SIGNATURE'] as const).map((modeOption) => (
                      <button
                        key={modeOption}
                        onClick={() => setMode(modeOption)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          mode === modeOption
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="font-medium">{modeOption}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getModeDescription(modeOption)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleSubmitBriefing}
                  loading={brandOperation.loading}
                  disabled={!businessContext.trim()}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  SUBMIT_BRIEFING
                </Button>
              </div>
            </Card>

            {/* Show current week data if available */}
            {currentWeek && (
              <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  Available Agent Data
                </h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className={`flex items-center space-x-2 ${currentWeek.clo_briefing_note ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${currentWeek.clo_briefing_note ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>CLO Data</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${currentWeek.socratic_conversation ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${currentWeek.socratic_conversation ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>Socratic Data</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${currentWeek.lead_engineer_briefing_note ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${currentWeek.lead_engineer_briefing_note ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>Alex Data</span>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {strategyData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                Brand Strategy Package
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Mode:</span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm font-medium">
                  {mode}
                </span>
              </div>
            </div>

            {/* Content Themes */}
            {strategyData.content_themes && strategyData.content_themes.length > 0 && (
              <Card className="p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Content Themes
                </h5>
                <div className="flex flex-wrap gap-2">
                  {strategyData.content_themes.map((theme, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Social Content */}
            {mockSocialContent.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Social Content Ready to Publish
                </h5>
                <SocialContentGrid
                  contents={mockSocialContent}
                  onCopy={(platform) => toast.success(`${platform} content copied!`)}
                  onPublish={(platform) => toast.success(`Published to ${platform}!`)}
                />
              </div>
            )}

            {/* KPI Metrics */}
            {mockKPIMetrics.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Performance Metrics
                </h5>
                <KPIGrid metrics={mockKPIMetrics} variant="compact" />
              </div>
            )}

            {/* Brand Voice Analysis */}
            {strategyData.brand_voice_analysis && (
              <Card className="p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Brand Voice Analysis
                </h5>
                <p className="text-gray-700 dark:text-gray-300">
                  {strategyData.brand_voice_analysis}
                </p>
              </Card>
            )}

            {/* Engagement Strategies */}
            {strategyData.engagement_strategies && strategyData.engagement_strategies.length > 0 && (
              <Card className="p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Engagement Strategies
                </h5>
                <ul className="space-y-2">
                  {strategyData.engagement_strategies.map((strategy, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{strategy}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button 
                  onClick={() => {
                    setStrategyData(null);
                    setBriefingSubmitted(false);
                  }}
                  variant="outline"
                >
                  New Strategy
                </Button>
                <Button 
                  onClick={() => handleSetMode('SIGNATURE')}
                  loading={brandOperation.loading}
                  disabled={mode === 'SIGNATURE'}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Upgrade to Signature
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Package
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};