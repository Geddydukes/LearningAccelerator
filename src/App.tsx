import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { AuthForm } from './components/auth/AuthForm';
import AppShell from './components/layout/AppShell';
import { SimpleAppShell } from './components/layout/SimpleAppShell';
import { UnifiedLearningPlatform } from './components/workspace/UnifiedLearningPlatform';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useEffect } from 'react';

function AppContent() {
  useEffect(() => {
    // Smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href')!);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      // Add subtle scroll-based animations
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');
            }
          });
        },
        { threshold: 0.1 }
      );

      // Observe sections for animation
      document.querySelectorAll('section').forEach((section) => {
        observer.observe(section);
      });
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/auth" element={<AuthForm />} />
        
        {/* Protected routes */}
        <Route path="/home/*" element={<AppShell />} />
        
        {/* Legacy routes - redirect to new structure */}
        <Route path="/workspace" element={<Navigate to="/home/workspace" replace />} />
        <Route path="/clo" element={<Navigate to="/home/workspace" replace />} />
        <Route path="/unified-learning" element={<Navigate to="/home/workspace" replace />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;