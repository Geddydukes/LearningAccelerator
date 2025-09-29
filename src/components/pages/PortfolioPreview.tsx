import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PortfolioPreviewProps {
  userTier?: 'free' | 'premium' | 'enterprise';
}

export function PortfolioPreview({ userTier = 'free' }: PortfolioPreviewProps) {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const portfolioTemplates = [
    {
      id: 'developer',
      name: 'Developer Portfolio',
      description: 'Showcase your coding projects, skills, and technical expertise',
      tier: 'free' as const,
      features: ['Project showcase', 'Skills display', 'GitHub integration', 'Contact form'],
      preview: '/api/portfolio/preview/developer'
    },
    {
      id: 'designer',
      name: 'Design Portfolio',
      description: 'Display your creative work, design process, and visual skills',
      tier: 'premium' as const,
      features: ['Project gallery', 'Design process', 'Interactive elements', 'Custom branding'],
      preview: '/api/portfolio/preview/designer'
    },
    {
      id: 'data-scientist',
      name: 'Data Science Portfolio',
      description: 'Highlight your analytical projects, research, and data insights',
      tier: 'premium' as const,
      features: ['Interactive charts', 'Project analysis', 'Research papers', 'Skills matrix'],
      preview: '/api/portfolio/preview/data-scientist'
    },
    {
      id: 'fullstack',
      name: 'Full-Stack Portfolio',
      description: 'Comprehensive showcase of frontend, backend, and DevOps skills',
      tier: 'enterprise' as const,
      features: ['Full project demos', 'Architecture diagrams', 'Performance metrics', 'Live deployments'],
      preview: '/api/portfolio/preview/fullstack'
    }
  ];

  const canAccessTemplate = (templateTier: string) => {
    if (userTier === 'enterprise') return true;
    if (userTier === 'premium' && templateTier !== 'enterprise') return true;
    if (userTier === 'free' && templateTier === 'free') return true;
    return false;
  };

  const generatePortfolio = async (templateId: string) => {
    setIsGenerating(true);
    
    // Simulate portfolio generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Generating portfolio with template:', templateId);
    setIsGenerating(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Portfolio Generator</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Create a professional portfolio website to showcase your skills, projects, and achievements
        </p>
        <div className="mt-4 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          <span className="font-medium">Current Tier:</span>
          <span className="ml-2 capitalize">{userTier}</span>
        </div>
      </div>

      {/* Portfolio Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portfolioTemplates.map((template) => {
          const hasAccess = canAccessTemplate(template.tier);
          
          return (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Template Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.tier === 'enterprise' 
                      ? 'bg-purple-100 text-purple-800' 
                      : template.tier === 'premium'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {template.tier}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                
                {/* Features List */}
                <div className="space-y-2">
                  {template.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Actions */}
              <div className="p-6">
                {hasAccess ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedTemplate(template.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Preview Template
                    </button>
                    
                    <button
                      onClick={() => generatePortfolio(template.id)}
                      disabled={isGenerating}
                      className={`w-full px-4 py-2 rounded text-sm transition-colors ${
                        isGenerating
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isGenerating ? 'Generating...' : 'Generate Portfolio'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {template.tier === 'enterprise' 
                        ? 'Upgrade to Enterprise for access to advanced portfolio templates'
                        : 'Upgrade to Premium for access to professional portfolio templates'
                      }
                    </p>
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

      {/* Template Preview */}
      {selectedTemplate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Template Preview: {portfolioTemplates.find(t => t.id === selectedTemplate)?.name}
            </h3>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Preview Content */}
          <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Portfolio Preview</h4>
            <p className="text-gray-600 mb-4">
              This is where the live preview of your portfolio would appear. 
              The preview shows exactly how your final portfolio will look.
            </p>
            <div className="bg-white rounded-lg p-4 border border-gray-200 max-w-md mx-auto">
              <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {userTier === 'free' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Unlock Premium Portfolio Templates</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get access to professional portfolio templates with advanced features, custom branding, 
            and interactive elements. Stand out from the crowd with a premium portfolio.
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

      {/* Portfolio Features */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Responsive Design</h4>
            <p className="text-sm text-gray-600">Looks great on all devices and screen sizes</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Fast Performance</h4>
            <p className="text-sm text-gray-600">Optimized for speed and SEO</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Customizable</h4>
            <p className="text-sm text-gray-600">Personalize colors, fonts, and layout</p>
          </div>
        </div>
      </div>
    </div>
  );
}
