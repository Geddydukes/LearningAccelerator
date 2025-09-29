import { createClient } from '@supabase/supabase-js';

export interface CodingSession {
  id: string;
  user_id: string;
  language: string;
  focus_areas: string[];
  week?: number;
  day?: number;
  file_system: Record<string, { content: string; type: string }>;
  task_brief: any;
  tests: string;
  getting_started: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CodingRun {
  id: string;
  session_id: string;
  user_id: string;
  language: string;
  tests: boolean;
  result: {
    success: boolean;
    output: string;
    error: string;
    exitCode: number;
    type: 'tests' | 'main';
  };
  created_at: string;
}

export interface CodingWorkspaceResponse {
  success: boolean;
  data?: {
    sessionId: string;
    language: string;
    focusAreas: string[];
    fileSystem: Record<string, { content: string; type: string }>;
    taskBrief: any;
    tests: string;
    gettingStarted: string;
    etag?: string;
  };
  error?: string;
}

export interface CodingRunResponse {
  success: boolean;
  data?: {
    result: {
      success: boolean;
      output: string;
      error: string;
      exitCode: number;
      type: 'tests' | 'main';
    };
    sessionId: string;
    etag?: string;
  };
  error?: string;
}

class CodingWorkspaceClient {
  private supabase: any;
  private baseUrl: string;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coding-workspace`;
  }

  async startWorkspace(
    userId: string,
    language: string = 'javascript',
    focusAreas: string[] = [],
    week?: number,
    day?: number
  ): Promise<CodingWorkspaceResponse> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${this.baseUrl}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          payload: {
            language,
            focusAreas,
            week,
            day,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Coding workspace start failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async runCode(
    userId: string,
    sessionId: string,
    fileSystem: Record<string, { content: string; type: string }>,
    tests: boolean = false,
    language?: string
  ): Promise<CodingRunResponse> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Convert file system to array format
      const fs = Object.entries(fileSystem).map(([name, file]) => ({
        name,
        content: file.content,
        type: file.type,
      }));

      const response = await fetch(`${this.baseUrl}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          sessionId,
          payload: {
            fs,
            tests,
            language,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Coding workspace run failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async submitForReview(
    userId: string,
    sessionId: string,
    fileSystem: Record<string, { content: string; type: string }>,
    language: string
  ): Promise<any> {
    try {
      // This would call Alex agent for final grading
      // For now, we'll use the existing Alex agent through the agent proxy
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alex-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'FINAL_GRADE',
          payload: {
            submission: {
              files: fileSystem,
              language,
            },
            rubric: {
              // Default rubric - would be customized based on focus areas
              criteria: [
                { name: 'Functionality', weight: 0.4 },
                { name: 'Code Quality', weight: 0.3 },
                { name: 'Testing', weight: 0.2 },
                { name: 'Documentation', weight: 0.1 },
              ],
            },
          },
          userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Coding submission review failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Session management
  async getSession(sessionId: string): Promise<CodingSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('coding_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No session found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get coding session:', error);
      return null;
    }
  }

  async getSessions(userId: string, week?: number): Promise<CodingSession[]> {
    try {
      let query = this.supabase
        .from('coding_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (week !== undefined) {
        query = query.eq('week', week);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get coding sessions:', error);
      return [];
    }
  }

  async updateSession(sessionId: string, updates: Partial<CodingSession>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('coding_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to update coding session:', error);
      return false;
    }
  }

  // Run history
  async getRuns(sessionId: string): Promise<CodingRun[]> {
    try {
      const { data, error } = await this.supabase
        .from('coding_runs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get coding runs:', error);
      return [];
    }
  }

  // File system utilities
  static createFile(name: string, content: string, type: string = 'text/plain') {
    return { content, type };
  }

  static updateFile(fileSystem: Record<string, { content: string; type: string }>, name: string, content: string) {
    return {
      ...fileSystem,
      [name]: {
        ...fileSystem[name],
        content,
      },
    };
  }

  static deleteFile(fileSystem: Record<string, { content: string; type: string }>, name: string) {
    const newFileSystem = { ...fileSystem };
    delete newFileSystem[name];
    return newFileSystem;
  }

  static getFileContent(fileSystem: Record<string, { content: string; type: string }>, name: string): string {
    return fileSystem[name]?.content || '';
  }

  static listFiles(fileSystem: Record<string, { content: string; type: string }>): string[] {
    return Object.keys(fileSystem);
  }
}

// Export singleton instance
export const codingWorkspaceClient = new CodingWorkspaceClient();