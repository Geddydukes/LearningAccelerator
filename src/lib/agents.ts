import { DatabaseService } from './database';

export class AgentOrchestrator {
  static async callCLOAgent(userId: string, userInput: string, weekNumber: number) {
    try {
      console.log('🎯 CLO Agent called for user:', userId, 'week:', weekNumber, 'input:', userInput);
      
      // Call the agent-proxy with CLO agent type
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          agent: 'clo',
          action: userInput,
          payload: { weekNumber },
          userId
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Handle different response types
        if (result.data.text_response) {
          // CLO is requesting something (like AGREE_PARAMS)
          console.log('📝 CLO text response:', result.data.text_response);
          return { success: true, data: { text_response: result.data.text_response } };
        } else {
          // Save structured data to database with completion status
          console.log('💾 Saving CLO module data for week:', weekNumber);
          
          // Flatten the CLO_Briefing_Note and CLO_Assessor_Directive for easier access
          const flattenedData = {
            ...result.data,
            // If we have nested structure, flatten it
            ...(result.data.CLO_Briefing_Note || {}),
            ...(result.data.CLO_Assessor_Directive || {}),
            // Store the full response text for complete module display  
            full_content: result.data.full_response_text,
            raw_response: result.data.raw_response
          };
          
          await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
            clo_briefing_note: flattenedData,
            completion_status: {
              clo_completed: true,
              socratic_completed: false,
              alex_completed: false,
              brand_completed: false,
              overall_progress: 25
            }
          });
          
          // Return the CLO data for potential handoff to Socratic
          return { success: true, data: flattenedData };
        }
      }
      
      return result;
    } catch (error) {
      console.error('CLO Agent error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async callSocraticAgent(
    userId: string, 
    sessionId: string, 
    userMessage: string, 
    conversationHistory: string[] = [],
    cloData?: any
  ) {
    try {
      // Get CLO briefing note if not provided
      let cloContext = cloData;
      if (!cloContext) {
        const currentWeek = await DatabaseService.getCurrentWeek(userId);
        cloContext = currentWeek?.clo_briefing_note;
      }
      
      // Add user message to database
      await DatabaseService.addMessage(sessionId, 'user', userMessage);
      
      // Call the agent-proxy with Socratic agent type
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          agent: 'socratic',
          action: 'CONTINUE_SESSION',
          payload: { 
            message: userMessage, 
            conversationHistory, 
            cloContext,
            sessionId 
          },
          userId
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Add assistant response to database
        await DatabaseService.addMessage(sessionId, 'assistant', result.data.question);
        
        // Update session with new question count
        await DatabaseService.updateSocraticSession(sessionId, {
          total_questions: (await DatabaseService.getSessionMessages(sessionId)).length
        });
        
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('Socratic Agent error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async callAlexAgent(userId: string, repositoryUrl: string, weekNumber: number) {
    try {
      console.log('👨‍💻 Alex Agent called for user:', userId, 'repo:', repositoryUrl, 'week:', weekNumber);
      
      // Call the agent-proxy with Alex agent type
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          agent: 'alex',
          action: 'REVIEW_CODE',
          payload: { repositoryUrl, weekNumber },
          userId
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Save structured data to database
        console.log('💾 Saving Alex analysis data for week:', weekNumber);
        
        await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
          lead_engineer_briefing_note: result.data,
          completion_status: {
            clo_completed: true,
            socratic_completed: true,
            alex_completed: true,
            brand_completed: false,
            overall_progress: 75
          }
        });
        
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('Alex Agent error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async callBrandAgent(
    userId: string, 
    businessContext: string, 
    weekNumber: number,
    personalReflection?: string
  ) {
    try {
      console.log('🎨 Brand Agent called for user:', userId, 'context:', businessContext.substring(0, 50) + '...', 'week:', weekNumber);
      
      // Get weekly intelligence from other agents
      const currentWeek = await DatabaseService.getCurrentWeek(userId);
      const weeklyIntelligence = {
        clo_briefing_note: currentWeek?.clo_briefing_note,
        socratic_briefing_note: currentWeek?.socratic_conversation,
        lead_engineer_briefing_note: currentWeek?.lead_engineer_briefing_note
      };
      
      // Call the agent-proxy with Brand agent type
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          agent: 'brand',
          action: 'SUBMIT_BRIEFING',
          payload: { 
            businessContext, 
            weeklyIntelligence, 
            personalReflection, 
            weekNumber 
          },
          userId
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Save structured data to database
        console.log('💾 Saving Brand strategy data for week:', weekNumber);
        
        await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
          brand_strategy_package: result.data,
          completion_status: {
            clo_completed: true,
            socratic_completed: true,
            alex_completed: true,
            brand_completed: true,
            overall_progress: 100
          }
        });
        
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('Brand Agent error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async runWeeklyFlow(
    userId: string, 
    weekNumber: number, 
    userInput: string,
    businessContext: string,
    personalReflection?: string
  ) {
    try {
      console.log('🔄 Running weekly flow for user:', userId, 'week:', weekNumber);
      
      // Run the flow through individual agent calls
      const cloResult = await this.callCLOAgent(userId, userInput, weekNumber);
      if (!cloResult.success) return cloResult;
      
      const brandResult = await this.callBrandAgent(userId, businessContext, weekNumber, personalReflection);
      if (!brandResult.success) return brandResult;
      
      // Return combined results
      const combinedData = {
        clo: cloResult.data,
        brand: brandResult.data,
        alex: null // Alex requires repository URL, so it's separate
      };
      
      console.log('✅ Weekly flow completed successfully');
      return { success: true, data: combinedData };
    } catch (error) {
      console.error('Weekly flow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}