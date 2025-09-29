import { DatabaseService } from './database';
import { AGENTS, AgentId, isPremium } from './agents/registry';

// Simple in-flight request deduplication and short-lived cache
type AgentCacheEntry = { expiresAt: number; result: any };
const INFLIGHT_REQUESTS: Map<string, Promise<any>> = new Map();
const RESPONSE_CACHE: Map<string, AgentCacheEntry> = new Map();
const CACHE_TTL_MS = 30_000; // 30 seconds

function makeRequestKey(userId: string, action: string, weekNumber: number): string {
	return `${userId}:${action}:${weekNumber}`;
}

export class AgentOrchestrator {
	static async callCLOAgent(userId: string, action: string, weekNumber: number, payload?: any) {
		try {
			console.log('🎯 CLO Agent called for user:', userId, 'action:', action, 'week:', weekNumber, 'payload:', payload);
			const key = makeRequestKey(userId, action, weekNumber);

			// Serve from short-lived cache if available
			const cached = RESPONSE_CACHE.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				console.log('🗄️ Returning cached CLO result for', key);
				return cached.result;
			}

			// De-duplicate concurrent requests
			if (INFLIGHT_REQUESTS.has(key)) {
				console.log('🧵 Joining in-flight CLO request for', key);
				return await INFLIGHT_REQUESTS.get(key)!;
			}

			const requestPromise = (async () => {
				// Call the dedicated CLO agent function
				const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clo-agent`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					},
					body: JSON.stringify({
						action: action,
						payload: { weekNumber, timePerWeek: 5, ...payload },
						userId: userId
					})
				});
				
				const result = await response.json();
				
				if (result.success && result.data) {
					// Handle different response types
					if (result.data.text_response) {
						// CLO is requesting something (like AGREE_PARAMS)
						console.log('📝 CLO text response:', result.data.text_response);
						const finalResult = { success: true, data: { text_response: result.data.text_response } };
						RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
						return finalResult;
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
						
						// Build completion status dynamically from registry
						const completionStatus: any = {};
						Object.keys(AGENTS).forEach(agentId => {
							completionStatus[`${agentId}_completed`] = false;
						});
						completionStatus.overall_progress = 0;
						
						await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
							clo_briefing_note: flattenedData,
							completion_status: completionStatus
						});
						
						const finalResult = { success: true, data: flattenedData };
						RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
						return finalResult;
					}
				}
				
				return result;
			})();

			INFLIGHT_REQUESTS.set(key, requestPromise);
			try {
				return await requestPromise;
			} finally {
				INFLIGHT_REQUESTS.delete(key);
			}
		} catch (error) {
			console.error('❌ CLO Agent error:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async callSocraticAgent(userId: string, action: string, weekNumber: number, payload?: any) {
		try {
			console.log('🧠 Socratic Agent called for user:', userId, 'action:', action, 'week:', weekNumber, 'payload:', payload);
			const key = makeRequestKey(userId, `socratic_${action}`, weekNumber);

			// Serve from short-lived cache if available
			const cached = RESPONSE_CACHE.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				console.log('🗄️ Returning cached Socratic result for', key);
				return cached.result;
			}

			// De-duplicate concurrent requests
			if (INFLIGHT_REQUESTS.has(key)) {
				console.log('🧵 Joining in-flight Socratic request for', key);
				return await INFLIGHT_REQUESTS.get(key)!;
			}

			const requestPromise = (async () => {
				// Call the dedicated Socratic agent function
				const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/socratic-agent`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					},
					body: JSON.stringify({
						action: action,
						payload: { weekNumber, ...payload },
						userId: userId
					})
				});
				
				const result = await response.json();
				
				if (result.success) {
					const finalResult = { success: true, data: result.data };
					RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
					return finalResult;
				}
				
				return result;
			})();

			INFLIGHT_REQUESTS.set(key, requestPromise);
			try {
				return await requestPromise;
			} finally {
				INFLIGHT_REQUESTS.delete(key);
			}
		} catch (error) {
			console.error('❌ Socratic Agent error:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async callAlexAgent(userId: string, repositoryUrl: string, weekNumber: number) {
		try {
			console.log('👨‍💻 Alex Agent called for user:', userId, 'repo:', repositoryUrl, 'week:', weekNumber);
			
			// Call the dedicated Alex agent function
			const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alex-agent`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
				},
				body: JSON.stringify({
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
						instructor_completed: true,
						ta_completed: true,
						alex_completed: true,
						brand_completed: false,
						clarifier_completed: false,
						onboarder_completed: false,
						career_match_completed: false,
						portfolio_completed: false,
						overall_progress: 83
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
				instructor_lesson: currentWeek?.instructor_lesson,
				ta_session: currentWeek?.ta_session,
				lead_engineer_briefing_note: currentWeek?.lead_engineer_briefing_note,
				clarifier_session: currentWeek?.clarifier_session,
				onboarder_session: currentWeek?.onboarder_session,
				career_match_session: currentWeek?.career_match_session,
				portfolio_session: currentWeek?.portfolio_session
			};
			
			// Call the dedicated Brand agent function
			const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brand-agent`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
				},
				body: JSON.stringify({
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
						instructor_completed: true,
						ta_completed: true,
						alex_completed: true,
						brand_completed: true,
						clarifier_completed: false,
						onboarder_completed: false,
						career_match_completed: false,
						portfolio_completed: false,
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

	static async callInstructorAgent(
		userId: string, 
		action: string, 
		payload: any, 
		weekNumber?: number
	) {
		try {
			console.log('👨‍🏫 Instructor Agent called for user:', userId, 'action:', action, 'week:', weekNumber);
			const key = makeRequestKey(userId, `instructor_${action}`, weekNumber || 1);

			// Serve from short-lived cache if available
			const cached = RESPONSE_CACHE.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				console.log('🗄️ Returning cached Instructor result for', key);
				return cached.result;
			}

			// De-duplicate concurrent requests
			if (INFLIGHT_REQUESTS.has(key)) {
				console.log('🧵 Joining in-flight Instructor request for', key);
				return await INFLIGHT_REQUESTS.get(key)!;
			}

			const requestPromise = (async () => {
				// Call the dedicated Instructor agent function
				const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instructor-agent`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					},
					body: JSON.stringify({
						action: action,
						payload: { ...payload, weekNumber: weekNumber || 1 },
						userId: userId
					})
				});
				
				const result = await response.json();
				
				if (result.success && result.data) {
					// Save structured data to database
					console.log('💾 Saving Instructor data for week:', weekNumber || 1);
					
					await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber || 1, {
						instructor_lesson: result.data,
						completion_status: {
							clo_completed: false,
							socratic_completed: false,
							instructor_completed: true,
							ta_completed: false,
							alex_completed: false,
							brand_completed: false,
							clarifier_completed: false,
							onboarder_completed: false,
							career_match_completed: false,
							portfolio_completed: false,
							overall_progress: 17
						}
					});
					
					const finalResult = { success: true, data: result.data };
					RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
					return finalResult;
				}
				
				return result;
			})();

			INFLIGHT_REQUESTS.set(key, requestPromise);
			try {
				return await requestPromise;
			} finally {
				INFLIGHT_REQUESTS.delete(key);
			}
		} catch (error) {
			console.error('Instructor Agent error:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async callTAAgent(userId: string, action: string, weekNumber: number, payload?: any) {
		try {
			console.log('📝 TA Agent called for user:', userId, 'action:', action, 'week:', weekNumber, 'payload:', payload);
			const key = makeRequestKey(userId, `ta_${action}`, weekNumber);

			// Serve from short-lived cache if available
			const cached = RESPONSE_CACHE.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				console.log('🗄️ Returning cached TA result for', key);
				return cached.result;
			}

			// De-duplicate concurrent requests
			if (INFLIGHT_REQUESTS.has(key)) {
				console.log('🧵 Joining in-flight TA request for', key);
				return await INFLIGHT_REQUESTS.get(key)!;
			}

			const requestPromise = (async () => {
				// Call the dedicated TA agent function
				const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ta-agent`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					},
					body: JSON.stringify({
						action: action,
						payload: { weekNumber, ...payload },
						userId: userId
					})
				});
				
				const result = await response.json();
				
				if (result.success) {
					const finalResult = { success: true, data: result.data };
					RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
					return finalResult;
				}
				
				return result;
			})();

			INFLIGHT_REQUESTS.set(key, requestPromise);
			try {
				return await requestPromise;
			} finally {
				INFLIGHT_REQUESTS.delete(key);
			}
		} catch (error) {
			console.error('❌ TA Agent error:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async callClarifierAgent(
		userId: string, 
		action: string, 
		payload: any, 
		weekNumber: number
	) {
		try {
			console.log('🔍 Clarifier Agent called for user:', userId, 'action:', action, 'week:', weekNumber);
			const key = makeRequestKey(userId, `clarifier_${action}`, weekNumber);

			// Serve from short-lived cache if available
			const cached = RESPONSE_CACHE.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				console.log('🗄️ Returning cached Clarifier result for', key);
				return cached.result;
			}

			// De-duplicate concurrent requests
			if (INFLIGHT_REQUESTS.has(key)) {
				console.log('🧵 Joining in-flight Clarifier request for', key);
				return await INFLIGHT_REQUESTS.get(key)!;
			}

			const requestPromise = (async () => {
				// Call the dedicated Clarifier agent function
				const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clarifier-agent`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					},
					body: JSON.stringify({
						action: action,
						payload: { ...payload, weekNumber },
						userId: userId
					})
				});
				
				const result = await response.json();
				
				if (result.success && result.data) {
					// Save structured data to database
					console.log('💾 Saving Clarifier data for week:', weekNumber);
					
					await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
						clarifier_session: result.data,
						completion_status: {
							clo_completed: false,
							socratic_completed: false,
							instructor_completed: false,
							ta_completed: false,
							alex_completed: false,
							brand_completed: false,
							clarifier_completed: true,
							onboarder_completed: false,
							career_match_completed: false,
							portfolio_completed: false,
							overall_progress: 17
						}
					});
					
					const finalResult = { success: true, data: result.data };
					RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
					return finalResult;
				}
				
				return result;
			})();

			INFLIGHT_REQUESTS.set(key, requestPromise);
			try {
				return await requestPromise;
			} finally {
				INFLIGHT_REQUESTS.delete(key);
			}
		} catch (error) {
			console.error('Clarifier Agent error:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async callOnboarderAgent(
		userId: string, 
		action: string, 
		payload: any, 
		weekNumber: number
	) {
		try {
			console.log('🚀 Onboarder Agent called for user:', userId, 'action:', action, 'week:', weekNumber);
			const key = makeRequestKey(userId, `onboarder_${action}`, weekNumber);

			// Serve from short-lived cache if available
			const cached = RESPONSE_CACHE.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				console.log('🗄️ Returning cached Onboarder result for', key);
				return cached.result;
			}

			// De-duplicate concurrent requests
			if (INFLIGHT_REQUESTS.has(key)) {
				console.log('🧵 Joining in-flight Onboarder request for', key);
				return await INFLIGHT_REQUESTS.get(key)!;
			}

			const requestPromise = (async () => {
				// Call the dedicated Onboarder agent function
				const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarder-agent`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					},
					body: JSON.stringify({
						action: action,
						payload: { ...payload, weekNumber },
						userId: userId
					})
				});
				
				const result = await response.json();
				
				if (result.success && result.data) {
					// Save structured data to database
					console.log('💾 Saving Onboarder data for week:', weekNumber);
					
					await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
						onboarder_session: result.data,
						completion_status: {
							clo_completed: false,
							socratic_completed: false,
							instructor_completed: false,
							ta_completed: false,
							alex_completed: false,
							brand_completed: false,
							clarifier_completed: false,
							onboarder_completed: true,
							career_match_completed: false,
							portfolio_completed: false,
							overall_progress: 17
						}
					});
					
					const finalResult = { success: true, data: result.data };
					RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
					return finalResult;
				}
				
				return result;
			})();

			INFLIGHT_REQUESTS.set(key, requestPromise);
			try {
				return await requestPromise;
			} finally {
				INFLIGHT_REQUESTS.delete(key);
			}
		} catch (error) {
			console.error('Onboarder Agent error:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async callCareerMatchAgent(
		userId: string, 
		action: string, 
		payload: any, 
		weekNumber: number
	) {
		try {
			console.log('💼 Career Match Agent called for user:', userId, 'action:', action, 'week:', weekNumber);
			const key = makeRequestKey(userId, `career_match_${action}`, weekNumber);

			// Serve from short-lived cache if available
			const cached = RESPONSE_CACHE.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				console.log('🗄️ Returning cached Career Match result for', key);
				return cached.result;
			}

			// De-duplicate concurrent requests
			if (INFLIGHT_REQUESTS.has(key)) {
				console.log('🧵 Joining in-flight Career Match request for', key);
				return await INFLIGHT_REQUESTS.get(key)!;
			}

			const requestPromise = (async () => {
				// Call the dedicated Career Match agent function
				const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-match-agent`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					},
					body: JSON.stringify({
						action: action,
						payload: { ...payload, weekNumber },
						userId: userId
					})
				});
				
				const result = await response.json();
				
				if (result.success && result.data) {
					// Save structured data to database
					console.log('💾 Saving Career Match data for week:', weekNumber);
					
					await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
						career_match_session: result.data,
						completion_status: {
							clo_completed: false,
							socratic_completed: false,
							instructor_completed: false,
							ta_completed: false,
							alex_completed: false,
							brand_completed: false,
							clarifier_completed: false,
							onboarder_completed: false,
							career_match_completed: true,
							portfolio_completed: false,
							overall_progress: 17
						}
					});
					
					const finalResult = { success: true, data: result.data };
					RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
					return finalResult;
				}
				
				return result;
			})();

			INFLIGHT_REQUESTS.set(key, requestPromise);
			try {
				return await requestPromise;
			} finally {
				INFLIGHT_REQUESTS.delete(key);
			}
		} catch (error) {
			console.error('Career Match Agent error:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async callPortfolioAgent(
		userId: string, 
		action: string, 
		payload: any, 
		weekNumber: number
	) {
		try {
			console.log('📁 Portfolio Agent called for user:', userId, 'action:', action, 'week:', weekNumber);
			const key = makeRequestKey(userId, `portfolio_${action}`, weekNumber);

			// Serve from short-lived cache if available
			const cached = RESPONSE_CACHE.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				console.log('🗄️ Returning cached Portfolio result for', key);
				return cached.result;
			}

			// De-duplicate concurrent requests
			if (INFLIGHT_REQUESTS.has(key)) {
				console.log('🧵 Joining in-flight Portfolio request for', key);
				return await INFLIGHT_REQUESTS.get(key)!;
			}

			const requestPromise = (async () => {
				// Call the dedicated Portfolio agent function
				const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portfolio-agent`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					},
					body: JSON.stringify({
						action: action,
						payload: { ...payload, weekNumber },
						userId: userId
					})
				});
				
				const result = await response.json();
				
				if (result.success && result.data) {
					// Save structured data to database
					console.log('💾 Saving Portfolio data for week:', weekNumber);
					
					await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
						portfolio_session: result.data,
						completion_status: {
							clo_completed: false,
							socratic_completed: false,
							instructor_completed: false,
							ta_completed: false,
							alex_completed: false,
							brand_completed: false,
							clarifier_completed: false,
							onboarder_completed: false,
							career_match_completed: false,
							portfolio_completed: true,
							overall_progress: 17
						}
					});
					
					const finalResult = { success: true, data: result.data };
					RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
					return finalResult;
				}
				
				return result;
			})();

			INFLIGHT_REQUESTS.set(key, requestPromise);
			try {
				return await requestPromise;
			} finally {
				INFLIGHT_REQUESTS.delete(key);
			}
		} catch (error) {
			console.error('Portfolio Agent error:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async callAgentProxy(
		userId: string, 
		agent: 'clo' | 'socratic' | 'alex' | 'brand' | 'instructor' | 'ta' | 'clarifier' | 'onboarder' | 'career_match' | 'portfolio',
		action: string, 
		payload: any, 
		weekNumber: number
	) {
		try {
			console.log(`🤖 Agent Proxy called for ${agent} agent:`, { userId, action, weekNumber });
			const key = makeRequestKey(userId, `proxy_${agent}_${action}`, weekNumber);

			// Serve from short-lived cache if available
			const cached = RESPONSE_CACHE.get(key);
			if (cached && cached.expiresAt > Date.now()) {
				console.log('🗄️ Returning cached Agent Proxy result for', key);
				return cached.result;
			}

			// De-duplicate concurrent requests
			if (INFLIGHT_REQUESTS.has(key)) {
				console.log('🧵 Joining in-flight Agent Proxy request for', key);
				return await INFLIGHT_REQUESTS.get(key)!;
			}

			const requestPromise = (async () => {
				// Call the unified agent proxy function
				const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-proxy`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
					},
					body: JSON.stringify({
						agent: agent,
						action: action,
						payload: { ...payload, weekNumber },
						userId: userId
					})
				});
				
				const result = await response.json();
				
				if (result.success && result.data) {
					// Save structured data to database based on agent type
					console.log(`💾 Saving ${agent} agent data via proxy for week:`, weekNumber);
					
					const fieldMap = {
						'clo': 'clo_briefing_note',
						'socratic': 'socratic_conversation',
						'instructor': 'instructor_lesson',
						'ta': 'ta_session',
						'alex': 'lead_engineer_briefing_note',
						'brand': 'brand_strategy_package',
						'clarifier': 'clarifier_session',
						'onboarder': 'onboarder_session',
						'career_match': 'career_match_session',
						'portfolio': 'portfolio_session'
					};
					
					const updateField = fieldMap[agent];
					if (updateField) {
						await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
							[updateField]: result.data,
							completion_status: {
								clo_completed: agent === 'clo' ? true : false,
								socratic_completed: agent === 'socratic' ? true : false,
								instructor_completed: agent === 'instructor' ? true : false,
								ta_completed: agent === 'ta' ? true : false,
								alex_completed: agent === 'alex' ? true : false,
								brand_completed: agent === 'brand' ? true : false,
								clarifier_completed: agent === 'clarifier' ? true : false,
								onboarder_completed: agent === 'onboarder' ? true : false,
								career_match_completed: agent === 'career_match' ? true : false,
								portfolio_completed: agent === 'portfolio' ? true : false,
								overall_progress: 10
							}
						});
					}
					
					const finalResult = { success: true, data: result.data };
					RESPONSE_CACHE.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result: finalResult });
					return finalResult;
				}
				
				return result;
			})();

			INFLIGHT_REQUESTS.set(key, requestPromise);
			try {
				return await requestPromise;
			} finally {
				INFLIGHT_REQUESTS.delete(key);
			}
		} catch (error) {
			console.error('Agent Proxy error:', error);
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
			
			// Run the flow through all 6 agents in sequence
			const cloResult = await this.callCLOAgent(userId, userInput, weekNumber);
			if (!cloResult.success) return cloResult;
			
			const socraticResult = await this.callSocraticAgent(userId, 'START_SESSION', weekNumber, { message: userInput });
			if (!socraticResult.success) return socraticResult;
			
			const instructorResult = await this.callInstructorAgent(userId, 'GET_DAILY_LESSON', { dayNumber: 1 }, weekNumber);
			if (!instructorResult.success) return instructorResult;
			
			const taResult = await this.callTAAgent(userId, 'HELP_WITH_EXERCISE', weekNumber, { exerciseId: 'ex-1' });
			if (!taResult.success) return taResult;
			
			const alexResult = await this.callAlexAgent(userId, 'https://github.com/user/repo', weekNumber);
			if (!alexResult.success) return alexResult;
			
			const brandResult = await this.callBrandAgent(userId, businessContext, weekNumber, personalReflection);
			if (!brandResult.success) return brandResult;
			
			// Return combined results from all agents
			const combinedData = {
				clo: cloResult.data,
				socratic: socraticResult.data,
				instructor: instructorResult.data,
				ta: taResult.data,
				alex: alexResult.data,
				brand: brandResult.data
			};
			
			console.log('✅ Weekly flow completed successfully with all 6 agents');
			return { success: true, data: combinedData };
		} catch (error) {
			console.error('Weekly flow error:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async approveLearningPlan(userId: string, weekNumber: number) {
		try {
			console.log('✅ Approving learning plan for user:', userId, 'week:', weekNumber);
			
					// Update the completion status to mark CLO as approved
		const completionStatus: any = {};
		Object.keys(AGENTS).forEach(agentId => {
			completionStatus[`${agentId}_completed`] = agentId === 'clo' ? true : false;
		});
		completionStatus.overall_progress = 10;
		
		await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
			completion_status: completionStatus
		});
			
			console.log('✅ Learning plan approved for week:', weekNumber);
			return { success: true, message: 'Learning plan approved successfully' };
		} catch (error) {
			console.error('Error approving learning plan:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async resetWeeklyProgress(userId: string, weekNumber: number) {
		try {
			console.log('🔄 Resetting weekly progress for user:', userId, 'week:', weekNumber);
			
					// Reset all completion statuses for the new week
		const completionStatus: any = {};
		Object.keys(AGENTS).forEach(agentId => {
			completionStatus[`${agentId}_completed`] = false;
		});
		completionStatus.overall_progress = 0;
		
		await DatabaseService.createOrUpdateWeeklyNote(userId, weekNumber, {
			completion_status: completionStatus
		});
			
			console.log('✅ Weekly progress reset for week:', weekNumber);
			return { success: true, message: 'Weekly progress reset successfully' };
		} catch (error) {
			console.error('Error resetting weekly progress:', error);
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	}

	static async checkAlexChallengeCompletion(userId: string, weekNumber: number) {
		try {
			console.log('🔍 Checking Alex challenge completion for user:', userId, 'week:', weekNumber);
			
			// Get current weekly note to check Alex completion
			const currentWeek = await DatabaseService.getCurrentWeek(userId);
			
			if (currentWeek?.completion_status?.alex_completed) {
				console.log('✅ Alex challenge completed, triggering weekly reset');
				
				// Reset progress for the next phase
				await this.resetWeeklyProgress(userId, weekNumber + 1);
				
				return { 
					success: true, 
					alexCompleted: true, 
					message: 'Alex challenge completed, weekly progress reset for next phase' 
				};
			}
			
			return { 
				success: true, 
				alexCompleted: false, 
				message: 'Alex challenge not yet completed' 
			};
		} catch (error) {
			console.error('Error checking Alex challenge completion:', error);
			return { 
				success: false, 
				error: error instanceof Error ? error.message : 'Unknown error' 
			};
		}
	}
}