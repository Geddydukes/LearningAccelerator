import { supabase } from './supabase';
import { User, WeeklyNote, CLOBriefingNote, SocraticSession, Message } from '../types';

export class DatabaseService {
  // User management
  static async createUser(authUser: any): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url,
        voice_preference: 'alloy',
        learning_preferences: {
          difficulty_level: 'intermediate',
          focus_areas: ['full-stack-development', 'react', 'typescript'],
          learning_pace: 'normal',
          preferred_interaction_style: 'mixed'
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get next week number for user
  static async getNextWeekNumber(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('weekly_notes')
      .select('week_number')
      .eq('user_id', userId)
      .order('week_number', { ascending: false })
      .limit(1);

    if (error) throw error;
    
    const highestWeek = data && data.length > 0 ? data[0].week_number : 0;
    const nextWeek = highestWeek + 1;
    
    // Week calculation completed
    
    return nextWeek;
  }

  // Get all weeks for user (for progress tracking)
  static async getUserWeeks(userId: string): Promise<WeeklyNote[]> {
    const { data, error } = await supabase
      .from('weekly_notes')
      .select('*')
      .eq('user_id', userId)
      .order('week_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Weekly notes management
  static async getCurrentWeek(userId: string): Promise<WeeklyNote | null> {
    // Get the most recent week
    const currentWeekNumber = await this.getNextWeekNumber(userId) - 1;
    if (currentWeekNumber < 1) return null;
    
    // Getting current week

    const { data, error } = await supabase
      .from('weekly_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('week_number', currentWeekNumber)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createOrUpdateWeeklyNote(
    userId: string,
    weekNumber: number,
    updates: Partial<WeeklyNote>
  ): Promise<WeeklyNote> {
    // Creating/updating weekly note
    const { data, error } = await supabase
      .from('weekly_notes')
      .upsert({
        user_id: userId,
        week_number: weekNumber,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,week_number'
      })
      .select()
      .single();

    if (error) throw error;
    // Weekly note saved successfully
    return data;
  }

  // Socratic sessions
  static async createSocraticSession(
    userId: string,
    weekId?: string,
    topic?: string
  ): Promise<SocraticSession> {
    const { data, error } = await supabase
      .from('socratic_sessions')
      .insert({
        user_id: userId,
        week_id: weekId,
        topic,
        voice_enabled: false,
        session_metadata: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    audioUrl?: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        audio_url: audioUrl,
        metadata: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSessionMessages(sessionId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async updateSocraticSession(
    sessionId: string,
    updates: Partial<SocraticSession>
  ): Promise<SocraticSession> {
    const { data, error } = await supabase
      .from('socratic_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // TTS usage tracking
  static async checkTTSUsage(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { count, error } = await supabase
      .from('tts_usage')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('date', today);

    if (error) throw error;
    return count || 0;
  }

  static async recordTTSUsage(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('tts_usage')
      .upsert({
        user_id: userId,
        date: today
      }, {
        onConflict: 'user_id,date'
      });

    if (error) throw error;
  }

  // Delete weekly note
  static async deleteWeeklyNote(userId: string, weekNumber: number): Promise<void> {
    const { error } = await supabase
      .from('weekly_notes')
      .delete()
      .eq('user_id', userId)
      .eq('week_number', weekNumber);

    if (error) throw error;
  }
}