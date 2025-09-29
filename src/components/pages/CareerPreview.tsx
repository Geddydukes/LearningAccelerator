import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface CareerPreviewProps {
  userTier?: 'free' | 'premium' | 'enterprise';
}

export function CareerPreview({ userTier = 'free' }: CareerPreviewProps) {
  const { user } = useAuth();
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null);

  const careerInsights = [
    {
      id: 1,
      title: 'AI/ML Job Market Analysis',
      description: 'Comprehensive analysis of current AI/ML job market trends, salary ranges, and in-demand skills.',
      tier: 'premium' as const,
      preview: 'The AI/ML job market is experiencing unprecedented growth with...',
      fullContent: 'The AI/ML job market is experiencing unprecedented growth with companies across all industries seeking talent. Our analysis shows that entry-level positions start at $80,000-$120,000, while senior roles can reach $200,000+. The most in-demand skills include Python, TensorFlow, PyTorch, and cloud platforms like AWS and Azure. Companies are particularly interested in candidates with practical project experience and the ability to deploy models to production.',
      tags: ['AI/ML', 'Job Market', 'Salary Data', 'Skills Analysis']
    },
    {
      id: 2,
      title: 'Career Transition Roadmap',
      description: 'Step-by-step guide for transitioning into tech from other industries.',
      tier: 'premium' as const,
      preview: 'Transitioning to a tech career requires careful planning and...',
      fullContent: 'Transitioning to a tech career requires careful planning and strategic skill development. Start by identifying transferable skills from your current role - project management, problem-solving, and communication are highly valued in tech. Focus on building a strong foundation in programming fundamentals before specializing. Create a portfolio of projects that demonstrate your abilities, and network actively in the tech community. Consider starting with roles that bridge your current expertise with tech, such as product management or technical sales.',
      tags: ['Career Change', 'Transition Guide', 'Skill Mapping', 'Portfolio Building']
    },
    {
      id: 3,
      title: 'Interview Preparation Masterclass',
      description: 'Complete guide to technical interviews, behavioral questions, and negotiation strategies.',
      tier: 'enterprise' as const,
      preview: 'Technical interviews can be intimidating, but with proper preparation...',
      fullContent: 'Technical interviews can be intimidating, but with proper preparation, you can excel. Start by practicing coding problems on platforms like LeetCode and HackerRank. Focus on understanding data structures and algorithms, as these are fundamental to most technical interviews. For behavioral questions, use the STAR method (Situation, Task, Action, Result) to structure your responses. Practice explaining technical concepts clearly and concisely. When it comes to negotiation, research salary ranges for your role and experience level, and be prepared to discuss your value proposition confidently.',
      tags: ['Interview Prep', 'Coding Practice', 'Behavioral Questions', 'Negotiation']
    }
  ];

  const canAccessInsight = (insightTier: string) => {
    if (userTier === 'enterprise') return true;
    if (userTier === 'premium' && insightTier !== 'enterprise') return true;
    if (userTier === 'free' && insightTier === 'free') return true;
    return false;
  };

  const getUpgradeMessage = (requiredTier: string) => {
    if (requiredTier === 'enterprise') {
      return 'Upgrade to Enterprise for access to advanced career insights and personalized coaching.';
    }
    return 'Upgrade to Premium for access to comprehensive career insights and market analysis.';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Career Insights</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get expert insights into the tech job market, career transitions, and interview preparation
        </p>
        <div className="mt-4 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          <span className="font-medium">Current Tier:</span>
          <span className="ml-2 capitalize">{userTier}</span>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {careerInsights.map((insight) => {
          const hasAccess = canAccessInsight(insight.tier);
          
          return (
            <div key={insight.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    insight.tier === 'enterprise' 
                      ? 'bg-purple-100 text-purple-800' 
                      : insight.tier === 'premium'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {insight.tier}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{insight.description}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {hasAccess ? (
                  <div>
                    {selectedInsight === insight.id ? (
                      <div className="space-y-4">
                        <p className="text-gray-700 leading-relaxed">{insight.fullContent}</p>
                        <div className="flex flex-wrap gap-2">
                          {insight.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => setSelectedInsight(null)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Show Less
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-700 leading-relaxed">{insight.preview}</p>
                        <button
                          onClick={() => setSelectedInsight(insight.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Read More
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{getUpgradeMessage(insight.tier)}</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                      Upgrade Plan
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {userTier === 'free' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Unlock Premium Career Insights</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get access to comprehensive job market analysis, career transition guides, and interview preparation resources. 
            Upgrade to Premium or Enterprise to accelerate your career growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Upgrade to Premium
            </button>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
              Upgrade to Enterprise
            </button>
          </div>
        </div>
      )}

      {/* Additional Resources */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Career Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Resume Builder</h4>
            <p className="text-sm text-gray-600 mb-3">Create professional resumes tailored to tech roles</p>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Get Started →
            </button>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Networking Events</h4>
            <p className="text-sm text-gray-600 mb-3">Connect with industry professionals and mentors</p>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Browse Events →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
