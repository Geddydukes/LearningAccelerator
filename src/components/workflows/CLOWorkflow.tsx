import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Target, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { AgentOrchestrator } from '../../lib/agents';
import { DatabaseService } from '../../lib/database';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CollapsibleMarkdown, LearningObjectives, KeyConcepts, Resources } from '../ui/CollapsibleMarkdown';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

export const CLOWorkflow: React.FC = () => {
  const { user, currentWeek } = useDatabase();
  const navigate = useNavigate();
  const [step, setStep] = useState<'params' | 'generating' | 'review' | 'approved'>('params');
  const [moduleData, setModuleData] = useState(null);
  const [hasAgreedParams, setHasAgreedParams] = useState(false);
  const [prerequisiteAnswers, setPrerequisiteAnswers] = useState<string[]>([]);
  const currentWeekNumber = 1;
  // Load existing module data on component mount
  useEffect(() => {
    if (user && currentWeek?.clo_briefing_note) {
      console.log('📚 Loading existing CLO module:', currentWeek.clo_briefing_note);
      setModuleData(currentWeek.clo_briefing_note);
      setHasAgreedParams(true);
      setStep('review');
    }
  }, [user, currentWeek]);


  const cloOperation = useAsyncOperation({
    showToast: false,
    onSuccess: (data) => {
      if (data.text_response) {
        // CLO is asking for something
        toast.info(data.text_response);
      } else {
        // CLO returned module data
        setModuleData(data);
        setStep('review');
        toast.success('Learning module generated!');
      }
    },
    onError: (error) => {
      toast.error('Failed to generate module');
      setStep('params');
    }
  });

  const handleAgreeParams = async () => {
    if (!user) return;
    
    setStep('generating');
    
    console.log('🚀 Starting CLO workflow for week:', currentWeekNumber);

    await cloOperation.execute(async () => {
      // First agree to params
      const agreeResult = await AgentOrchestrator.callCLOAgent(
        user.id,
        'AGREE_PARAMS',
        currentWeekNumber
      );
      
      if (agreeResult.success) {
        // Then begin week
        const weekResult = await AgentOrchestrator.callCLOAgent(
          user.id,
          'BEGIN_WEEK',
          currentWeekNumber
        );
        
        if (weekResult.success) {
          return weekResult.data;
        } else {
          throw new Error(weekResult.error);
        }
      } else {
        throw new Error(agreeResult.error);
      }
    });
  };

  const handleApproveModule = () => {
    setStep('approved');
    toast.success('Module approved! Moving to Socratic dialogue...');
    
    // Navigate to Socratic after a brief delay
    setTimeout(() => {
      navigate('/socratic');
    }, 1500);
  };

  const handleRejectModule = async () => {
    if (!user) return;
    
    try {
      // Delete the weekly note from database
      await DatabaseService.deleteWeeklyNote(user.id, currentWeekNumber);
      
      // Reset all state
      setStep('params');
      setModuleData(null);
      setHasAgreedParams(false);
      setPrerequisiteAnswers([]);
      
      toast.success('Module rejected. Starting over...');
    } catch (error) {
      console.error('Error rejecting module:', error);
      toast.error('Failed to reject module');
    }
  };

  const handleSubmitPrerequisites = async () => {
    if (!user || prerequisiteAnswers.some(answer => !answer?.trim())) return;
    
    setStep('generating');
    
    await cloOperation.execute(async () => {
      const result = await AgentOrchestrator.callCLOAgent(
        user.id,
        'SUBMIT_PREREQUISITES',
        currentWeekNumber,
        { answers: prerequisiteAnswers }
      );
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    });
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  CLO - Curriculum Architect
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate your personalized learning module
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleBackToDashboard}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[
              { key: 'params', label: 'Parameters', icon: Target },
              { key: 'generating', label: 'Generating', icon: Clock },
              { key: 'review', label: 'Review', icon: BookOpen },
              { key: 'approved', label: 'Approved', icon: CheckCircle }
            ].map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.key;
              const isCompleted = ['params', 'generating', 'review'].indexOf(step) > ['params', 'generating', 'review'].indexOf(stepItem.key);
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive || isCompleted 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500'
                  }`}>
                    {stepItem.label}
                  </span>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === 'params' && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Learning Commitment & Parameters
              </h2>
              
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📚 What You're Agreeing To:
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  By clicking "Agree", you commit to the CLO v2.0 learning framework with the parameters below. 
                  This will generate your personalized weekly learning module.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Time Investment</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">15-20 hours per week</p>
                    <p className="text-xs text-gray-500 mt-1">Theory 30% • Practice 40% • Project 30%</p>
                  </div>
                  
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <Target className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Learning Goals</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Month 3: Foundational Skills</p>
                    <p className="text-xs text-gray-500 mt-1">Month 6: Deployable AI Engineer</p>
                  </div>
                  
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Budget</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Optional resources ≤ $75</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📋 Full Commitment Details</h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• <strong>Hardware:</strong> Apple M4 Mac Mini with 24 GB unified memory (or equivalent)</li>
                    <li>• <strong>Cloud Backup:</strong> Free tiers for Google Colab and Kaggle available</li>
                    <li>• <strong>Budget Policy:</strong> Optional paid resources ≤ $75 with free alternatives</li>
                    <li>• <strong>Pacing:</strong> Mastery-based progression with targeted reinforcement</li>
                    <li>• <strong>Assessment:</strong> 4-5 (Mastery) = advance, 3 (Competency) = reinforcement, 1-2 = remedial</li>
                    <li>• <strong>Weekly Structure:</strong> 10-part modules with CLO briefings and Socratic handoffs</li>
                  </ul>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                    🎯 What Happens Next:
                  </h4>
                  <ol className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                    <li>1. CLO generates your personalized Week 1 learning module</li>
                    <li>2. You review the module content and approve it</li>
                    <li>3. Socratic Inquisitor begins guided questioning based on the module</li>
                    <li>4. You progress through the learning objectives with AI support</li>
                  </ol>
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={handleAgreeParams}
                    loading={cloOperation.loading}
                    size="lg"
                    className="px-8"
                  >
                    I Agree to These Parameters
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    This will send "AGREE_PARAMS" to CLO and begin module generation
                  </p>
                </div>
              </div>
            </Card>
          )}

          {step === 'generating' && (
            <Card className="p-12 text-center">
              <LoadingSpinner 
                variant="brain" 
                size="lg"
                message="CLO is generating your personalized learning module..."
              />
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                This may take a moment as we create content tailored to your learning goals.
              </p>
            </Card>
          )}

          {step === 'prerequisites' && moduleData && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Prerequisite Check
              </h2>
              
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  📋 Please answer these questions to confirm your readiness:
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your answers will help CLO determine if this module is appropriate or if adjustments are needed.
                </p>
              </div>

              <div className="space-y-6">
                {/* Extract prerequisite questions from the full response */}
                {(() => {
                  const fullText = moduleData.full_response_text || moduleData.raw_response || '';
                  const prerequisiteSection = fullText.match(/\*\*Prerequisite Check\*\*([\s\S]*?)(?=\*\*|$)/);
                  const questions = [];
                  
                  if (prerequisiteSection) {
                    const lines = prerequisiteSection[1].split('\n');
                    lines.forEach(line => {
                      const match = line.match(/^\d+\.\s+(.+)/);
                      if (match) {
                        questions.push(match[1]);
                      }
                    });
                  }
                  
                  // Fallback questions if parsing fails
                  if (questions.length === 0) {
                    questions.push(
                      "In Python, what is the primary difference between a list and a dictionary?",
                      "On a command line or terminal, what command would you use to see the contents of your current directory?",
                      "In one sentence, how does a machine 'learn' in a supervised learning context?"
                    );
                  }

                  return questions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Question {index + 1}: {question}
                      </label>
                      <textarea
                        value={prerequisiteAnswers[index] || ''}
                        onChange={(e) => {
                          const newAnswers = [...prerequisiteAnswers];
                          newAnswers[index] = e.target.value;
                          setPrerequisiteAnswers(newAnswers);
                        }}
                        className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your answer here..."
                      />
                    </div>
                  ));
                })()}
              </div>

              <div className="text-center mt-8">
                <Button 
                  onClick={handleSubmitPrerequisites}
                  loading={cloOperation.loading}
                  disabled={prerequisiteAnswers.some(answer => !answer?.trim())}
                  size="lg"
                  className="px-8 mr-4"
                >
                  Submit Answers
                </Button>
                <Button 
                  onClick={handleRejectModule}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  Reject & Start Over
                </Button>
              </div>
            </Card>
          )}

          {step === 'review' && moduleData && (
            <div className="space-y-6">
              {/* Debug: Show what data we have */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <summary className="cursor-pointer font-medium">Debug: Module Data</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(moduleData, null, 2)}
                  </pre>
                </details>
              )}

              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Week 1: {moduleData.weekly_theme || moduleData.module_title || 'Learning Module'}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Full Week Module</span>
                  </div>
                </div>

                {/* Weekly Theme Description */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📚 Weekly Theme
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200">
                    {moduleData.weekly_theme || 'Foundations and First Models: The End-to-End ML Workflow'}
                  </p>
                </div>

                {/* Key Socratic Insight */}
                {moduleData.key_socratic_insight && (
                  <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                      💡 Key Learning Insight
                    </h3>
                    <p className="text-emerald-800 dark:text-emerald-200">
                      {moduleData.key_socratic_insight}
                    </p>
                  </div>
                )}

                {/* Learning Objectives */}
                {(moduleData.objectives || moduleData.learning_objectives) && (
                  <CollapsibleMarkdown title="Learning Objectives" defaultOpen={true}>
                    <ul className="space-y-2">
                      {(moduleData.objectives || moduleData.learning_objectives).map((objective, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleMarkdown>
                )}

                {/* Expected Competency Level */}
                {moduleData.expected_competency && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      🎯 Expected Competency Level
                    </h3>
                    <p className="text-amber-800 dark:text-amber-200 capitalize">
                      {moduleData.expected_competency}
                    </p>
                  </div>
                )}

                {/* Full Module Text */}
                {(moduleData.full_content || moduleData.full_response_text || moduleData.raw_response) && (
                  <CollapsibleMarkdown title="Full Module Content" defaultOpen={false}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                        {moduleData.full_content || moduleData.full_response_text || moduleData.raw_response || 'No module content available'}
                      </div>
                    </div>
                  </CollapsibleMarkdown>
                )}

                {/* Version Info */}
                {moduleData.version && (
                  <div className="text-xs text-gray-500 text-center">
                    CLO v{moduleData.version} • Generated for Week 1
                  </div>
                )}

                <div className="text-center mt-8">
                  <Button 
                    onClick={handleApproveModule}
                    size="lg"
                    className="px-8 mr-4"
                  >
                    Approve & Continue to Socratic
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button 
                    onClick={handleRejectModule}
                    variant="outline"
                    size="lg"
                    className="px-8"
                  >
                    Reject & Start Over
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {step === 'approved' && (
            <Card className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Module Approved!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Redirecting you to the Socratic Inquisitor for guided learning...
              </p>
              <LoadingSpinner variant="dots" />
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};