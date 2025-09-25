import { createClient } from '@supabase/supabase-js';

export interface EducationSession {
  id: string;
  user_id: string;
  week: number;
  day: number;
  phase: 'planning' | 'lecture' | 'check' | 'practice_prep' | 'practice' | 'reflect' | 'completed';
  artifacts: Record<string, unknown>;
  etag: string;
  created_at: string;
  updated_at: string;
}

export interface EducationAgentResponse {
  success: boolean;
  data?: {
    phase: string;
    programPlan?: any;
    weeklyPlan?: any;
    lecture?: any;
    comprehensionCheck?: any;
    modifiedPrompts?: any;
    practiceType?: 'ta' | 'socratic' | 'coding';
    practice?: any;
    codingWorkspace?: any;
    practiceResults?: any;
    telemetry?: any;
    reflection?: any;
    artifacts?: Record<string, unknown>;
  };
  error?: string;
}

export interface EducationAgentRequest {
  event: string;
  userId: string;
  week?: number;
  day?: number;
  payload?: Record<string, unknown>;
  correlationId?: string;
  etagIfNoneMatch?: string;
}

class EducationAgentClient {
  private supabase: any;
  private baseUrl: string;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/education-agent`;
  }

  async call(request: EducationAgentRequest): Promise<EducationAgentResponse> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Education Agent call failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Convenience methods for each event
  async startDay(userId: string, week?: number, day?: number, payload?: Record<string, unknown>): Promise<EducationAgentResponse> {
    return this.call({
      event: 'start_day',
      userId,
      week,
      day,
      payload,
    });
  }

  async lectureDone(userId: string, week?: number, day?: number, payload?: Record<string, unknown>): Promise<EducationAgentResponse> {
    return this.call({
      event: 'lecture_done',
      userId,
      week,
      day,
      payload,
    });
  }

  async checkDone(userId: string, week?: number, day?: number, payload?: Record<string, unknown>): Promise<EducationAgentResponse> {
    return this.call({
      event: 'check_done',
      userId,
      week,
      day,
      payload,
    });
  }

  async practiceReady(userId: string, practiceType: 'ta' | 'socratic' | 'coding', week?: number, day?: number, payload?: Record<string, unknown>): Promise<EducationAgentResponse> {
    return this.call({
      event: 'practice_ready',
      userId,
      week,
      day,
      payload: {
        ...payload,
        practiceType,
      },
    });
  }

  async practiceDone(userId: string, week?: number, day?: number, payload?: Record<string, unknown>): Promise<EducationAgentResponse> {
    return this.call({
      event: 'practice_done',
      userId,
      week,
      day,
      payload,
    });
  }

  async reflectDone(userId: string, week?: number, day?: number, payload?: Record<string, unknown>): Promise<EducationAgentResponse> {
    return this.call({
      event: 'reflect_done',
      userId,
      week,
      day,
      payload,
    });
  }

  // Session management
  async getSession(userId: string, week: number, day: number): Promise<EducationSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('education_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('week', week)
        .eq('day', day)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No session found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  async getSessions(userId: string, week?: number): Promise<EducationSession[]> {
    try {
      let query = this.supabase
        .from('education_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('week', { ascending: true })
        .order('day', { ascending: true });

      if (week !== undefined) {
        query = query.eq('week', week);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  // Program Plan management
  async getProgramPlan(userId: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('program_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('accepted', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No program plan found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get program plan:', error);
      return null;
    }
  }

  async acceptProgramPlan(userId: string, programPlanId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('program_plans')
        .update({ accepted: true })
        .eq('id', programPlanId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to accept program plan:', error);
      return false;
    }
  }

  // Weekly Plan management
  async getWeeklyPlan(userId: string, week: number): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('week', week)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No weekly plan found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get weekly plan:', error);
      return null;
    }
  }

  // Telemetry and analytics
  async getSessionTelemetry(userId: string, week?: number): Promise<Record<string, any>> {
    try {
      let query = this.supabase
        .from('education_sessions')
        .select('artifacts')
        .eq('user_id', userId);

      if (week !== undefined) {
        query = query.eq('week', week);
      }

      const { data, error } = await query.order('week', { ascending: false });

      if (error) throw error;

      const telemetry: Record<string, any> = {
        instructor_hints: [],
        socratic_mastery: {},
        ta_blockers: [],
        alex_scorecard: { score: 0, gaps: [] },
        time_used_min: 0,
        degraded_days_count: 0,
      };

      data?.forEach(session => {
        if (session.artifacts?.telemetry) {
          Object.assign(telemetry, session.artifacts.telemetry);
        }
      });

      return telemetry;
    } catch (error) {
      console.error('Failed to get session telemetry:', error);
      return {};
    }
  }
}

// Export singleton instance
export const educationAgentClient = new EducationAgentClient();