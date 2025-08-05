import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageLoading } from './components/ui/LoadingSpinner';
import { InstallPrompt } from './components/ui/InstallPrompt';
import { UpdatePrompt } from './components/ui/UpdatePrompt';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useDatabase } from './hooks/useDatabase';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { AuthForm } from './components/auth/AuthForm';
import { LandingPage } from './components/landing/LandingPage';
import { UserSetup } from './components/auth/UserSetup';
import { CLOWorkflow } from './components/workflows/CLOWorkflow';
import { SocraticWorkflow } from './components/workflows/SocraticWorkflow';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { loading: dbLoading } = useDatabase();

  if (loading || dbLoading) {
    return <PageLoading message="Loading your learning dashboard..." />;
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { user: dbUser } = useDatabase();
  const [showSetup, setShowSetup] = React.useState(false);

  // Check if user needs to complete setup
  React.useEffect(() => {
    if (user && dbUser && !dbUser.learning_preferences?.difficulty_level) {
      setShowSetup(true);
    }
  }, [user, dbUser]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {user && <Header />}
        <Routes>
          <Route 
            path="/auth" 
            element={user ? <Navigate to="/" replace /> : <AuthForm />} 
          />
          <Route
            path="/setup"
            element={user ? (
              showSetup ? (
                <UserSetup onComplete={() => setShowSetup(false)} />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )}
          />
          <Route
            path="/landing"
            element={user ? <Navigate to="/" replace /> : <LandingPage />}
          />
          <Route
            path="/"
            element={showSetup ? (
              <Navigate to="/setup" replace />
            ) : user ? (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ) : (
              <LandingPage />
            )}
          />
          <Route
            path="/clo"
            element={
              <ProtectedRoute>
                <CLOWorkflow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/socratic"
            element={
              <ProtectedRoute>
                <SocraticWorkflow />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <InstallPrompt />
          <UpdatePrompt />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;