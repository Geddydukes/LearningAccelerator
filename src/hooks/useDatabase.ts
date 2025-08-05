import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../lib/database';
import { User, WeeklyNote } from '../types';
import toast from 'react-hot-toast';

export const useDatabase = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [currentWeek, setCurrentWeek] = useState<WeeklyNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      initializeUser();
    } else {
      setUser(null);
      setCurrentWeek(null);
      setLoading(false);
    }
  }, [authUser]);

  const initializeUser = async () => {
    try {
      setLoading(true);
      
      // Get or create user profile
      let userProfile = await DatabaseService.getUser(authUser!.id);
      if (!userProfile) {
        userProfile = await DatabaseService.createUser(authUser);
        toast.success('Welcome! Your profile has been created.');
      }
      setUser(userProfile);

      // Get current week
      const week = await DatabaseService.getCurrentWeek(authUser!.id);
      setCurrentWeek(week);

    } catch (error) {
      console.error('Failed to initialize user:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!authUser) return;

    try {
      const updatedUser = await DatabaseService.updateUser(authUser.id, updates);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const createOrUpdateWeek = async (updates: Partial<WeeklyNote>) => {
    if (!authUser) return;

    try {
      const currentWeekNumber = Math.ceil(
        (Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      const updatedWeek = await DatabaseService.createOrUpdateWeeklyNote(
        authUser.id,
        currentWeekNumber,
        updates
      );
      setCurrentWeek(updatedWeek);
      return updatedWeek;
    } catch (error) {
      console.error('Failed to update week:', error);
      toast.error('Failed to save progress');
    }
  };

  return {
    user,
    currentWeek,
    loading,
    updateUserProfile,
    createOrUpdateWeek,
    refreshData: initializeUser
  };
};