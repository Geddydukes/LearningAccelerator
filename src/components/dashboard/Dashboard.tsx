import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Clock, 
  Star,
  Zap,
  Users,
  Calendar,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();

  // Real dashboard data structure
  const dashboardStats = {
    totalXP: 2840,
    currentStreak: 7,
    modulesCompleted: 12,
    totalModules: 24,
    weeklyProgress: 85,
    rank: 'Advanced Learner',
    nextMilestone: 'Complete 15 modules',
    timeSpent: '23h 45m this week'
  };

  const recentActivities = [
    {
      id: 1,
      type: 'module_completed',
      title: 'AI Fundamentals',
      description: 'Completed Module 3: Neural Networks',
      timestamp: '2 hours ago',
      xp: 150,
      icon: Brain
    },
    {
      id: 2,
      type: 'streak_milestone',
      title: '7-Day Streak!',
      description: 'Maintained learning streak for 7 days',
      timestamp: '1 day ago',
      xp: 100,
      icon: Award
    },
    {
      id: 3,
      type: 'quiz_perfect',
      title: 'Perfect Score!',
      description: 'Aced the Machine Learning Quiz',
      timestamp: '3 days ago',
      xp: 200,
      icon: Star
    }
  ];

  const upcomingGoals = [
    {
      id: 1,
      title: 'Complete AI Ethics Module',
      deadline: '3 days',
      progress: 60,
      priority: 'high'
    },
    {
      id: 2,
      title: 'Build Portfolio Project',
      deadline: '1 week',
      progress: 25,
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Join Study Group',
      deadline: '2 weeks',
      progress: 0,
      priority: 'low'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-300 bg-red-500/20';
      case 'medium': return 'text-yellow-300 bg-yellow-500/20';
      case 'low': return 'text-green-300 bg-green-500/20';
      default: return 'text-gray-300 bg-gray-500/20';
    }
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl text-white mb-2">Welcome back, {user?.name || 'Learner'}! 🚀</h1>
            <p className="text-white/70">Excel at Everything. Don't Cheat, Master.</p>
          </div>
          <div className="text-right">
            <Badge className="bg-white/20 text-white border-white/30 mb-2">
              {dashboardStats.rank}
            </Badge>
            <p className="text-white/70 text-sm">
              {dashboardStats.timeSpent}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Progress */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Weekly Progress
              </CardTitle>
              <CardDescription className="text-white/70">
                Complete 5 tasks to unlock your weekly assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-white/90 mb-2">
                    <span>Tasks Completed</span>
                    <span>3/5</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-300"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-lg text-blue-300">2</div>
                    <div className="text-xs text-white/70">Socratic Sessions</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-lg text-green-300">1</div>
                    <div className="text-xs text-white/70">TA Projects</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white/40" />
                    </div>
                    <div className="text-xs text-white/70">Weekly Test</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Learning Tasks */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Learning Tasks
              </CardTitle>
              <CardDescription className="text-white/70">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-300" />
                      <div>
                        <h3 className="text-white">Understanding Neural Network Layers</h3>
                        <p className="text-sm text-white/70">Explore the fundamentals through guided questioning</p>
                      </div>
                    </div>
                    <Badge className="bg-white/10 text-white/80">
                      25 min
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">by Socratic Tutor</span>
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                      Start Task
                    </Button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-green-300" />
                      <div>
                        <h3 className="text-white">Build a Simple Perceptron</h3>
                        <p className="text-sm text-white/70">Hands-on coding project with step-by-step guidance</p>
                      </div>
                    </div>
                    <Badge className="bg-white/10 text-white/80">
                      45 min
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">by Teaching Assistant</span>
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                      Start Task
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activities
              </CardTitle>
              <CardDescription className="text-white/70">
                Your latest learning achievements and milestones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                      <Icon className="h-5 w-5 text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                        <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                          +{activity.xp} XP
                        </Badge>
                      </div>
                      <p className="text-sm text-white/70 mt-1">{activity.description}</p>
                      <p className="text-xs text-white/50 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Overview */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Your Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/70">Total XP</span>
                  <span className="text-white">{dashboardStats.totalXP.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Study Streak</span>
                  <span className="text-white">{dashboardStats.currentStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Modules</span>
                  <span className="text-white">{dashboardStats.modulesCompleted}/{dashboardStats.totalModules}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Course Progress</span>
                  <span className="text-white">{Math.round((dashboardStats.modulesCompleted / dashboardStats.totalModules) * 100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Goals */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Upcoming Goals
              </CardTitle>
              <CardDescription className="text-white/70">
                Track your progress on key learning objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingGoals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">{goal.title}</h4>
                    <Badge className={`text-xs ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/70">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/50">Due in {goal.deadline}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-white/70">
                Jump back into your learning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                <BookOpen className="w-4 h-4 mr-2" />
                Continue Learning
              </Button>
              <Button className="w-full justify-start bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                <Users className="w-4 h-4 mr-2" />
                Join Study Group
              </Button>
              <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                <Award className="w-4 h-4 mr-2" />
                View Achievements
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}