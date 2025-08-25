import React, { useState, useMemo, useCallback, memo } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { Menu, X, Home, Brain, Users, Briefcase, FileText, ChevronRight, Lock, Crown, CheckCircle, Circle, BookOpen } from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { CORE_AGENTS, PREMIUM_AGENTS, AGENTS } from '../../lib/agents/registry';
import HomeDashboard from '../home/HomeDashboard';
import { UnifiedLearningPlatform } from '../workspace/UnifiedLearningPlatform';
import { 
  CurrentModule, 
  SelfGuided, 
  PastTracks, 
  CareerPreview, 
  PortfolioPreview, 
  Settings 
} from '../pages';
import { SideNav } from './SideNav';

// Navigation items configuration - generated from agent registry
const NAV_ITEMS = [
  // Core learning items
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: PATHS.home,
    icon: Home,
    description: 'Your learning overview',
    requiresPremium: false
  },
  {
    id: 'workspace',
    label: 'Learning Workspace',
    path: PATHS.workspace,
    icon: BookOpen,
    description: 'Your active learning session',
    requiresPremium: false
  },
  {
    id: 'past-tracks',
    label: 'Past Learning Tracks',
    path: PATHS.pastTracks,
    icon: FileText,
    description: 'Your completed tracks',
    requiresPremium: false
  },
  // Core agents (weekly mode)
  ...CORE_AGENTS
    .filter(id => AGENTS[id].mode === 'weekly')
    .map(id => ({
      id: `agent-${id}`,
      label: AGENTS[id].title,
      path: AGENTS[id].route,
      icon: BookOpen, // Will be replaced with dynamic icon loading
      description: AGENTS[id].description,
      requiresPremium: false
    })),
  // Premium features
  {
    id: 'brand-career',
    label: 'Brand & Career',
    path: '/home/brand-career',
    icon: Briefcase,
    description: 'Brand strategy and career development (Premium)',
    requiresPremium: true
  }
];

// Simple content components for now
const Dashboard = memo(() => <HomeDashboard />);

const ModuleCurrent = memo(() => (
  <div className="p-6">
    <h1 className="text-3xl font-medium text-foreground mb-6">📚 Current Module</h1>
    <div className="bg-card border border-border/50 rounded-lg p-6">
      <p className="text-lg text-muted-foreground">Your current learning module will appear here.</p>
    </div>
  </div>
));

const SelfGuidedLearning = memo(() => (
  <div className="p-6">
    <h1 className="text-3xl font-medium text-foreground mb-6">🚀 Self-guided Learning</h1>
    <div className="bg-card border border-border/50 rounded-lg p-6">
      <p className="text-lg text-muted-foreground mb-4">
        Start a new learning journey with AI-powered guidance. Choose your focus area and we'll create a personalized learning plan.
      </p>
      <button 
        onClick={() => window.location.href = '/home/workspace'}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg transition-colors"
      >
        Start Learning Journey
      </button>
    </div>
  </div>
));

const PastLearningTracks = memo(() => {
  const { user } = useAuth();
  const { isPaid } = useSubscription();
  
  // Mock data - replace with real data from your database
  const pastTracks = [
    {
      id: 'fullstack_web_1',
      name: 'Full-Stack Web Development',
      completedAt: '2024-12-15',
      progress: 100,
      duration: '8 weeks',
      skills: ['React', 'Node.js', 'MongoDB'],
      certificate: true
    },
    {
      id: 'ai_ml_1',
      name: 'AI & Machine Learning',
      completedAt: '2024-11-20',
      progress: 85,
      duration: '6 weeks',
      skills: ['Python', 'TensorFlow', 'Data Analysis'],
      certificate: false
    }
  ];

  const maxTracks = isPaid ? 10 : 2;
  const canAddMore = pastTracks.length < maxTracks;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-medium text-foreground mb-2">📚 Past Learning Tracks</h1>
        <p className="text-muted-foreground">
          Track your learning journey and review completed courses
          {!isPaid && (
            <span className="text-foreground font-medium">
              {' '}(Limited to {maxTracks} tracks on basic plan)
            </span>
          )}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <div className="text-2xl font-medium text-foreground">{pastTracks.length}</div>
          <div className="text-sm text-muted-foreground">Completed Tracks</div>
        </div>
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <div className="text-2xl font-medium text-foreground">
            {pastTracks.filter(t => t.certificate).length}
          </div>
          <div className="text-sm text-muted-foreground">Certificates</div>
        </div>
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <div className="text-2xl font-medium text-foreground">
            {pastTracks.reduce((acc, t) => acc + t.skills.length, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Skills Learned</div>
        </div>
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <div className="text-2xl font-medium text-foreground">
            {pastTracks.reduce((acc, t) => acc + parseInt(t.duration), 0)} weeks
          </div>
          <div className="text-sm text-muted-foreground">Total Time</div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-4">
        {pastTracks.map((track) => (
          <div key={track.id} className="bg-card border border-border/50 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-medium text-foreground mb-2">{track.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                  <span>Completed: {track.completedAt}</span>
                  <span>Duration: {track.duration}</span>
                  <span className="flex items-center">
                    {track.certificate ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                        Certificate Earned
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-muted-foreground mr-1" />
                        No Certificate
                      </>
                    )}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{track.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${track.progress}%` }}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  {track.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-accent text-foreground text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="ml-4">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Review
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Track Button */}
        {canAddMore && (
          <div className="bg-muted/50 border-2 border-dashed border-border rounded-lg p-6 text-center">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              + Start New Learning Track
            </button>
            <p className="text-sm text-muted-foreground mt-2">
              Begin a new learning journey
            </p>
          </div>
        )}

        {!canAddMore && !isPaid && (
          <div className="bg-card border border-border/50 rounded-lg p-6 text-center">
            <div className="text-muted-foreground mb-3">
              <Lock className="w-8 h-8 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-foreground">Track Limit Reached</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              You've reached the limit of {maxTracks} tracks on your basic plan. 
              Upgrade to premium for unlimited learning tracks!
            </p>
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

const CareerHub = memo(() => (
  <div className="p-6">
    <h1 className="text-3xl font-medium text-foreground mb-6">💼 Career Hub</h1>
    <div className="bg-card border border-border/50 rounded-lg p-6">
      <p className="text-lg text-muted-foreground">Career development tools will appear here.</p>
    </div>
  </div>
));

const Portfolio = memo(() => (
  <div className="p-6">
    <h1 className="text-3xl font-medium text-foreground mb-6">📁 Portfolio</h1>
    <div className="bg-card border border-border/50 rounded-lg p-6">
      <p className="text-lg text-muted-foreground">Your portfolio will appear here.</p>
    </div>
  </div>
));

const SocraticChat = memo(() => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">💬 Socratic Chat</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-lg text-gray-600">Interactive learning chat will appear here.</p>
    </div>
  </div>
));

const AppShell = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isPaid } = useSubscription();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Get current active nav item
  const activeNavItem = useMemo(() => {
    return NAV_ITEMS.find(item => item.path === location.pathname) || NAV_ITEMS[0];
  }, [location.pathname]);

  // Handle navigation
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  }, [navigate]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate(PATHS.landing);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [signOut, navigate]);



  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <SideNav />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-card shadow-xl">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h1 className="text-xl font-medium text-foreground">
                Wisely
              </h1>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="p-4 space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const isPremium = item.requiresPremium && !isPaid;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isPremium) {
                        // Show upgrade prompt for premium features
                        alert('This feature requires a premium subscription. Please upgrade to access.');
                        return;
                      }
                      handleNavigation(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isPremium
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-foreground hover:bg-accent'
                    }`}
                    disabled={isPremium}
                  >
                    <Icon className={`w-5 h-5 ${
                      isActive ? 'text-primary-foreground' : isPremium ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`} />
                    <div className="ml-3 text-left flex-1">
                      <div className="font-medium flex items-center justify-between">
                        {item.label}
                        {isPremium && (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Mobile User Section */}
            <div className="p-4 border-t border-border/50 mt-auto">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.email || 'User'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-card border border-border/50 rounded-lg shadow-lg"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="h-full">
          <Routes>
            <Route path="/" element={<HomeDashboard />} />
            <Route path="/module/current" element={<CurrentModule trackLabel="AI/ML Engineering" />} />
            <Route path="/self-guided" element={<SelfGuided />} />
            <Route path="/past-tracks" element={<PastTracks />} />
            <Route path="/workspace" element={<UnifiedLearningPlatform />} />
            <Route path="/career" element={<CareerPreview userTier={isPaid ? 'premium' : 'free'} />} />
            <Route path="/portfolio" element={<PortfolioPreview userTier={isPaid ? 'premium' : 'free'} />} />
            <Route path="/settings" element={<Settings userTier={isPaid ? 'premium' : 'free'} />} />
            <Route path="*" element={<HomeDashboard />} />
          </Routes>
        </div>
      </div>
    </div>
  );
});

AppShell.displayName = 'AppShell';

export default AppShell; 