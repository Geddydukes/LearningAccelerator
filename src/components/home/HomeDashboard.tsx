import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDatabase } from '../../hooks/useDatabase';
import { useSubscription } from '../../hooks/useSubscription';
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  Lock, 
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  Circle
} from 'lucide-react';

interface LearningTrack {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  icon: string;
  color: string;
  isActive?: boolean;
  progress?: number;
}

const LEARNING_TRACKS: LearningTrack[] = [
  {
    id: 'fullstack_web',
    name: 'Full-Stack Web Development',
    description: 'Master modern web development with React, Node.js, and cloud deployment',
    difficulty: 'intermediate',
    estimatedDuration: 20,
    icon: '🌐',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ai_ml',
    name: 'AI & Machine Learning',
    description: 'Learn AI fundamentals, neural networks, and practical ML applications',
    difficulty: 'advanced',
    estimatedDuration: 25,
    icon: '🤖',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Master security fundamentals, ethical hacking, and defense strategies',
    difficulty: 'intermediate',
    estimatedDuration: 22,
    icon: '🔒',
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'data_eng',
    name: 'Data Engineering',
    description: 'Build data pipelines, ETL processes, and analytics infrastructure',
    difficulty: 'advanced',
    estimatedDuration: 24,
    icon: '📊',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'devops',
    name: 'DevOps & Cloud',
    description: 'Master CI/CD, containerization, and cloud infrastructure',
    difficulty: 'intermediate',
    estimatedDuration: 18,
    icon: '☁️',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    id: 'blockchain',
    name: 'Blockchain Development',
    description: 'Learn smart contracts, DeFi protocols, and Web3 technologies',
    difficulty: 'advanced',
    estimatedDuration: 26,
    icon: '⛓️',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'game_dev',
    name: 'Game Development',
    description: 'Create games with Unity, Unreal Engine, and game design principles',
    difficulty: 'intermediate',
    estimatedDuration: 23,
    icon: '🎮',
    color: 'from-pink-500 to-purple-500'
  },
  {
    id: 'ux_design',
    name: 'UX/UI Design',
    description: 'Master user experience design, prototyping, and design systems',
    difficulty: 'beginner',
    estimatedDuration: 16,
    icon: '🎨',
    color: 'from-teal-500 to-green-500'
  },
  {
    id: 'product_mgmt',
    name: 'Product Management',
    description: 'Learn product strategy, user research, and agile methodologies',
    difficulty: 'beginner',
    estimatedDuration: 19,
    icon: '📋',
    color: 'from-gray-500 to-slate-500'
  },
  {
    id: 'tech_writing',
    name: 'Technical Writing',
    description: 'Master documentation, API guides, and technical communication',
    difficulty: 'beginner',
    estimatedDuration: 15,
    icon: '✍️',
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 'ai_ethics',
    name: 'AI Ethics & Governance',
    description: 'Explore responsible AI, bias detection, and ethical frameworks',
    difficulty: 'intermediate',
    estimatedDuration: 21,
    icon: '⚖️',
    color: 'from-violet-500 to-purple-500'
  }
];

export default function HomeDashboard() {
  const { user, currentWeek } = useDatabase();
  const { hasFeature, isPaid } = useSubscription();
  const [currentTrack, setCurrentTrack] = useState<LearningTrack | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<any>(null);

  useEffect(() => {
    if (user?.learning_preferences?.focus_areas?.[0]) {
      const track = LEARNING_TRACKS.find(t => t.id === user.learning_preferences.focus_areas[0]);
      if (track) {
        setCurrentTrack(track);
        // Add progress data
        track.isActive = true;
        track.progress = 65; // Mock progress - replace with real data
      }
    }
  }, [user]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-medium text-foreground mb-4"
          >
            Welcome back, {user?.name || 'Learner'}! 👋
          </motion.h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Continue your learning journey or explore new tracks to expand your skills
          </p>
        </div>

        {/* Current Learning Track */}
        {currentTrack && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="bg-card border border-border/50 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-medium text-foreground mb-2">
                    Continue Learning
                  </h2>
                  <p className="text-muted-foreground">
                    Pick up where you left off in your current track
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl mb-2">{currentTrack.icon}</div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentTrack.difficulty)}`}>
                    {getDifficultyLabel(currentTrack.difficulty)}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-3">
                    {currentTrack.name}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {currentTrack.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>{currentTrack.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${currentTrack.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {currentTrack.estimatedDuration} weeks
                    </span>
                    <span className="flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Week {currentWeek || 1}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-8 rounded-lg transition-all duration-200 flex items-center mx-auto space-x-2">
                    <Play className="w-5 h-5" />
                    <span>Continue Learning</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Learning Tracks Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-medium text-foreground mb-4">
              Explore Learning Tracks
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from our curated selection of industry-relevant learning paths
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LEARNING_TRACKS.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="bg-card border border-border/50 rounded-lg p-6 hover:border-border transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{track.icon}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(track.difficulty)}`}>
                      {getDifficultyLabel(track.difficulty)}
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {track.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {track.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{track.estimatedDuration} weeks</span>
                    </div>
                    
                    <button 
                      onClick={() => window.location.href = '/home/workspace'}
                      className="bg-accent hover:bg-accent/80 text-foreground p-2 rounded-lg transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Premium Features Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-muted/50 border border-border/50 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⭐</div>
              <h2 className="text-3xl font-medium text-foreground mb-4">
                Unlock Premium Features
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get access to advanced career matching, portfolio building, and personalized coaching
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Career Match */}
              <div className="text-center">
                <div className="bg-card border border-border/50 rounded-xl p-6 mb-4">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Career Match
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    AI-powered career path recommendations based on your skills and goals
                  </p>
                  {isPaid ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm">Unlocked</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Lock className="w-5 h-5 mr-2" />
                      <span className="text-sm">Premium</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio Builder */}
              <div className="text-center">
                <div className="bg-card border border-border/50 rounded-xl p-6 mb-4">
                  <div className="text-3xl mb-3">📁</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Portfolio Builder
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create stunning project portfolios to showcase your skills
                  </p>
                  {isPaid ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm">Unlocked</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Lock className="w-5 h-5 mr-2" />
                      <span className="text-sm">Premium</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Coach */}
              <div className="text-center">
                <div className="bg-card border border-border/50 rounded-xl p-6 mb-4">
                  <div className="text-3xl mb-3">👨‍🏫</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Personal Coach
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    1-on-1 coaching sessions with industry experts
                  </p>
                  {isPaid ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm">Unlocked</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Lock className="w-5 h-5 mr-2" />
                      <span className="text-sm">Premium</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isPaid && (
              <div className="text-center mt-8">
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-8 rounded-lg transition-all duration-200">
                  Upgrade to Premium
                </button>
                <p className="text-muted-foreground text-sm mt-2">
                  Start your 7-day free trial today
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="bg-card border border-border/50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-2xl font-medium text-foreground mb-1">11</div>
            <div className="text-sm text-muted-foreground">Learning Tracks</div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-medium text-foreground mb-1">500+</div>
            <div className="text-sm text-muted-foreground">Learning Hours</div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-medium text-foreground mb-1">25</div>
            <div className="text-sm text-muted-foreground">Certificates</div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-medium text-foreground mb-1">4.9</div>
            <div className="text-sm text-muted-foreground">User Rating</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
