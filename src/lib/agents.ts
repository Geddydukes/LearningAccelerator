import { AgentProxyService } from './gemini';
import { DatabaseService } from './database';

export class AgentOrchestrator {
  static async callCLOAgent(userId: string, userInput: string, weekNumber: number) {
    try {
      console.log('🎯 CLO Agent called for user:', userId, 'week:', weekNumber, 'input:', userInput);
      
      // Call agent proxy instead of direct Gemini API
      const response = await AgentProxyService.callCLOAgent(userId, userInput, weekNumber);
      
      if (response.success && response.data) {
        // Handle different response types
        if (response.data.text_response) {
          // CLO is requesting something (like AGREE_PARAMS)
          console.log('📝 CLO text response:', response.data.text_response);
          return { success: true, data: { text_response: response.data.text_response } };
        } else {
          // Save structured data to database with completion status
          console.log('💾 Saving CLO module data for week:', weekNumber);
          
          // Flatten the CLO_Briefing_Note and CLO_Assessor_Directive for easier access
          const flattenedData = {
            ...response.data,
            // If we have nested structure, flatten it
            ...(response.data.CLO_Briefing_Note || {}),
            ...(response.data.CLO_Assessor_Directive || {}),
            // Store the full response text for complete module display  
            full_content: response.data.full_response_text,
            raw_response: response.data.raw_response
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
      
      return response;
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
      
      // Call agent proxy instead of direct Gemini API
      const response = await AgentProxyService.callSocraticAgent(
        userId,
        userMessage, 
        conversationHistory, 
        cloContext,
        sessionId
      );
      
      if (response.success && response.data) {
        // Add assistant response to database
        await DatabaseService.addMessage(sessionId, 'assistant', response.data.question);
        
        // Update session with new question count
        await DatabaseService.updateSocraticSession(sessionId, {
          total_questions: (await DatabaseService.getSessionMessages(sessionId)).length
        });
        
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('Socratic Agent error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async callAlexAgent(userId: string, repositoryUrl: string, weekNumber: number) {
    try {
      console.log('👨‍💻 Alex Agent called for user:', userId, 'repo:', repositoryUrl, 'week:', weekNumber);
      
      // Call agent proxy instead of direct Gemini API
      const response = await AgentProxyService.callAlexAgent(userId, repositoryUrl, undefined, weekNumber);
      
      if (response.success && response.data) {
        // Save structured data to database
        console.log('💾 Saving Alex analysis data for week:', weekNumber);
        
        await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
          lead_engineer_briefing_note: response.data,
          completion_status: {
            clo_completed: true,
            socratic_completed: true,
            alex_completed: true,
            brand_completed: false,
            overall_progress: 75
          }
        });
        
        return response;
      }
      
      return response;
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
      
      // Call agent proxy instead of direct Gemini API
      const response = await AgentProxyService.callBrandAgent(
        userId,
        businessContext,
        weeklyIntelligence,
        personalReflection,
        weekNumber
      );
      
      if (response.success && response.data) {
        // Save structured data to database
        console.log('💾 Saving Brand strategy data for week:', weekNumber);
        
        await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
          brand_strategy_package: response.data,
          completion_status: {
            clo_completed: true,
            socratic_completed: true,
            alex_completed: true,
            brand_completed: true,
            overall_progress: 100
          }
        });
        
        return response;
      }
      
      return response;
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
      
      // Use the new AgentProxyService for the complete flow
      const response = await AgentProxyService.runWeeklyFlow(
        userId,
        weekNumber,
        userInput,
        businessContext,
        personalReflection
      );
      
      if (response.success && response.data) {
        // Save the complete weekly flow data
        await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
          clo_briefing_note: response.data.clo,
          lead_engineer_briefing_note: response.data.alex,
          brand_strategy_package: response.data.brand,
          completion_status: {
            clo_completed: true,
            socratic_completed: false, // Socratic is separate
            alex_completed: !!response.data.alex,
            brand_completed: true,
            overall_progress: response.data.alex ? 100 : 75
          }
        });
        
        console.log('✅ Weekly flow completed successfully');
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('Weekly flow error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}