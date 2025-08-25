import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SelfGuidedProps {
  onStartLearning?: (topic: string, goal: string) => void;
}

export function SelfGuided({ onStartLearning }: SelfGuidedProps) {
  const { user } = useAuth();
  const [learningTopic, setLearningTopic] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [timeAvailable, setTimeAvailable] = useState(15);
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [currentPhase, setCurrentPhase] = useState<'planning' | 'learning' | 'practice' | 'assessment'>('planning');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learningTopic.trim() || !learningGoal.trim()) return;

    setIsProcessing(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentPhase('learning');
    setIsProcessing(false);
    
    if (onStartLearning) {
      onStartLearning(learningTopic, learningGoal);
    }
  };

  const startCLOPlanning = () => {
    // This would trigger the CLO agent to create a learning plan
    console.log('Starting CLO planning for:', learningTopic);
  };

  const startSocraticSession = () => {
    // This would trigger the Socratic agent for guided questioning
    console.log('Starting Socratic session for:', learningTopic);
  };

  const startTASession = () => {
    // This would trigger the TA agent for hands-on practice
    console.log('Starting TA session for:', learningTopic);
  };

  const startAlexAssessment = () => {
    // This would trigger the Alex agent for assessment
    console.log('Starting Alex assessment for:', learningTopic);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Self-Guided Learning</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Learn anything you want using our AI-powered learning tools. Create a custom learning plan 
          and get personalized guidance for any topic.
        </p>
      </div>

      {/* Learning Topic Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What would you like to learn?</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Topic
            </label>
            <input
              type="text"
              value={learningTopic}
              onChange={(e) => setLearningTopic(e.target.value)}
              placeholder="e.g., Quantum Computing, Advanced React Patterns, Machine Learning Ethics..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to achieve?
            </label>
            <textarea
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder="e.g., I want to understand the fundamentals of quantum computing and be able to implement basic quantum algorithms..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time available per week (hours)
              </label>
              <select
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 hours</option>
                <option value={10}>10 hours</option>
                <option value={15}>15 hours</option>
                <option value={20}>20 hours</option>
                <option value={30}>30 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !learningTopic.trim() || !learningGoal.trim()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isProcessing || !learningTopic.trim() || !learningGoal.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isProcessing ? 'Creating your learning plan...' : 'Start Learning Journey'}
          </button>
        </form>
      </div>

      {/* Learning Tools */}
      {currentPhase === 'learning' && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Your Learning Tools for: {learningTopic}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CLO Planning */}
            <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Learning Plan</h4>
              <p className="text-sm text-gray-600 mb-3">Get a structured plan from our CLO agent</p>
              <button
                onClick={startCLOPlanning}
                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                Create Plan
              </button>
            </div>

            {/* Socratic Learning */}
            <div className="bg-white rounded-lg p-4 border border-blue-200 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Socratic Session</h4>
              <p className="text-sm text-gray-600 mb-3">Learn through guided questioning</p>
              <button
                onClick={startSocraticSession}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Start Session
              </button>
            </div>

            {/* TA Practice */}
            <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Practice & Projects</h4>
              <p className="text-sm text-gray-600 mb-3">Get hands-on practice with our TA</p>
              <button
                onClick={startTASession}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
              >
                Start Practice
              </button>
            </div>

            {/* Alex Assessment */}
            <div className="bg-white rounded-lg p-4 border border-orange-200 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Assessment</h4>
              <p className="text-sm text-gray-600 mb-3">Test your knowledge with Alex</p>
              <button
                onClick={startAlexAssessment}
                className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
              >
                Take Assessment
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentPhase('planning')}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
            >
              ← Back to Planning
            </button>
          </div>
        </div>
      )}

      {/* Learning Tips */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How Self-Guided Learning Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 text-sm font-bold">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Plan</h4>
              <p className="text-sm text-gray-600">Use our CLO agent to create a personalized learning plan for your topic.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-bold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Learn</h4>
              <p className="text-sm text-gray-600">Engage with our Socratic agent for guided learning and deep understanding.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-purple-600 text-sm font-bold">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Practice</h4>
              <p className="text-sm text-gray-600">Work on hands-on projects and exercises with our TA agent.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-600 text-sm font-bold">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Assess</h4>
              <p className="text-sm text-gray-600">Test your knowledge and get feedback from our Alex agent.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
