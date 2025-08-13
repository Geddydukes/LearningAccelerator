import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export function SimpleAppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-medium">
            Welcome to Wisely, {user.name || 'Learner'}!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered learning journey is ready to begin. 
            Choose your path and start building hireable skills.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              onClick={() => navigate('/unified-learning')}
            >
              Start Learning
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8"
              onClick={() => {
                // TODO: Navigate to dashboard
                console.log('Go to dashboard');
              }}
            >
              View Dashboard
            </Button>
          </div>

          <div className="mt-8">
            <Button
              variant="ghost"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 