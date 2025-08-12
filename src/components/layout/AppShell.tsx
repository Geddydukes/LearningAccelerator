import React, { useState, useMemo, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Brain, Users, Briefcase, FileText, ChevronRight } from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { useAuth } from '../../contexts/AuthContext';

// Navigation items configuration
const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: PATHS.home,
    icon: Home,
    description: 'Your learning overview'
  },
  {
    id: 'module',
    label: 'Current Module',
    path: PATHS.moduleCurrent,
    icon: Brain,
    description: 'Continue your learning'
  },
  {
    id: 'socratic',
    label: 'Socratic Chat',
    path: PATHS.socratic,
    icon: Users,
    description: 'Interactive learning'
  },
  {
    id: 'ta',
    label: 'Teaching Assistant',
    path: PATHS.ta,
    icon: Brain,
    description: 'Get help & guidance'
  },
  {
    id: 'career',
    label: 'Career Hub',
    path: PATHS.career,
    icon: Briefcase,
    description: 'Career development'
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    path: PATHS.portfolio,
    icon: FileText,
    description: 'Showcase your work'
  }
];

// Simple content components for now
const Dashboard = memo(() => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">🏠 Dashboard</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-lg text-gray-600">Welcome to your learning dashboard!</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Total XP</h3>
          <p className="text-2xl font-bold text-blue-600">2,840</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Current Streak</h3>
          <p className="text-2xl font-bold text-green-600">7 days</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Modules</h3>
          <p className="text-2xl font-bold text-purple-600">12/24</p>
        </div>
      </div>
    </div>
  </div>
));

const ModuleCurrent = memo(() => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">📚 Current Module</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-lg text-gray-600">Your current learning module will appear here.</p>
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

// Content switching logic
const getContentComponent = useCallback((pathname: string) => {
  console.log('AppShell: Rendering content for pathname:', pathname);
  
  switch (pathname) {
    case PATHS.home:
      return <Dashboard />;
    case PATHS.moduleCurrent:
      return <ModuleCurrent />;
    case PATHS.socratic:
      return <SocraticChat />;
    case PATHS.ta:
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🤖 Teaching Assistant</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-lg text-gray-600">Teaching assistant will appear here.</p>
          </div>
        </div>
      );
    case PATHS.career:
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">💼 Career Hub</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-lg text-gray-600">Career development tools will appear here.</p>
          </div>
        </div>
      );
    case PATHS.portfolio:
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">📁 Portfolio</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-lg text-gray-600">Your portfolio will appear here.</p>
          </div>
        </div>
      );
    default:
      console.log('AppShell: Default case, showing Dashboard');
      return <Dashboard />;
  }
}, []);

const AppShell = memo(() => {
  console.log('AppShell: Component rendering');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  console.log('AppShell: Current location:', location.pathname);
  console.log('AppShell: User:', user);

  // Get current active nav item
  const activeNavItem = useMemo(() => {
    return NAV_ITEMS.find(item => item.path === location.pathname) || NAV_ITEMS[0];
  }, [location.pathname]);

  // Handle navigation
  const handleNavigation = useCallback((path: string) => {
    console.log('AppShell: Navigating to:', path);
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

  // Get current content component
  const currentContent = useMemo(() => {
    return getContentComponent(location.pathname);
  }, [location.pathname, getContentComponent]);

  console.log('AppShell: About to render content');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-800">
              Learning Accelerator
            </h1>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${
              isSidebarCollapsed ? 'rotate-180' : ''
            }`} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`} />
                {!isSidebarCollapsed && (
                  <div className="ml-3 text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-800">
                Learning Accelerator
              </h1>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="p-4 space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <div className="ml-3 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Mobile User Section */}
            <div className="p-4 border-t border-gray-200 mt-auto">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email || 'User'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">/</span>
              <span className="text-sm font-medium text-gray-900">
                {activeNavItem.label}
              </span>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {/* Add any header actions here */}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {currentContent}
        </main>
      </div>
    </div>
  );
});

AppShell.displayName = 'AppShell';

export default AppShell; 