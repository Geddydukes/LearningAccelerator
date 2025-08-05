import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { auth } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(transformSupabaseUser(session.user));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(transformSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const transformSupabaseUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    voice_preference: supabaseUser.user_metadata?.voice_preference,
    learning_preferences: supabaseUser.user_metadata?.learning_preferences,
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at || supabaseUser.created_at,
  });

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in with:', { email, password: '***' });
    const { error } = await auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    console.log('Sign in successful');
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Attempting sign up with:', { email, name, password: '***' });
    const { error } = await auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }
    console.log('Sign up successful');
  };

  const signOut = async () => {
    console.log('Attempting sign out');
    const { error } = await auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    console.log('Sign out successful');
  };

  const sendMagicLink = async (email: string) => {
    console.log('Sending magic link to:', email);
    const { error } = await auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      console.error('Magic link error:', error);
      throw error;
    }
    console.log('Magic link sent successfully');
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    sendMagicLink,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};