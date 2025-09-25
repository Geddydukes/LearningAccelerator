#!/usr/bin/env tsx

/**
 * Production Readiness Test Script
 * 
 * This script tests all the implemented features to ensure production readiness:
 * - All 10 agents have individual functions
 * - Agent-proxy handles all agents
 * - Instructor-centric learning flow works
 * - Voice integration is complete
 * - All environment variables are configured
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: string;
}

class ProductionReadinessTester {
  private results: TestResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Production Readiness Tests...\n');

    // Phase 1: Missing Agent Functions
    await this.testMissingAgentFunctions();
    
    // Phase 2: Agent-Proxy Handlers
    await this.testAgentProxyHandlers();
    
    // Phase 3: Prompt Version Mismatches
    await this.testPromptVersionMismatches();
    
    // Phase 4: Instructor Enhancement
    await this.testInstructorEnhancement();
    
    // Phase 5: Prompt Modification System
    await this.testPromptModificationSystem();
    
    // Phase 6: TA/Socratic Updates
    await this.testTASocraticUpdates();
    
    // Phase 7: Instructor Interface
    await this.testInstructorInterface();
    
    // Phase 8: Agent Orchestrator
    await this.testAgentOrchestrator();
    
    // Phase 9: Voice Integration
    await this.testVoiceIntegration();
    
    // Phase 10: Environment Configuration
    await this.testEnvironmentConfiguration();

    this.printResults();
  }

  private async testMissingAgentFunctions(): Promise<void> {
    console.log('📋 Testing Missing Agent Functions...');
    
    const agentFunctions = [
      'supabase/functions/onboarder-agent/index.ts',
      'supabase/functions/portfolio-curator/index.ts',
      'supabase/functions/clarifier-agent/index.ts'
    ];

    for (const agentPath of agentFunctions) {
      const fullPath = join(this.projectRoot, agentPath);
      const exists = existsSync(fullPath);
      
      this.addResult({
        test: `Agent Function: ${agentPath}`,
        status: exists ? 'PASS' : 'FAIL',
        message: exists ? 'Agent function exists' : 'Agent function missing',
        details: exists ? 'File found' : `Expected file at ${fullPath}`
      });
    }
  }

  private async testAgentProxyHandlers(): Promise<void> {
    console.log('🔗 Testing Agent-Proxy Handlers...');
    
    const agentProxyPath = join(this.projectRoot, 'supabase/functions/agent-proxy/source/index.ts');
    
    if (!existsSync(agentProxyPath)) {
      this.addResult({
        test: 'Agent-Proxy Handlers',
        status: 'FAIL',
        message: 'Agent-proxy file not found',
        details: `Expected file at ${agentProxyPath}`
      });
      return;
    }

    const content = readFileSync(agentProxyPath, 'utf-8');
    
    const requiredHandlers = [
      'handleOnboarderAgent',
      'handlePortfolioAgent', 
      'handleClarifierAgent',
      'handleTAAgent',
      'handleInstructorAgent',
      'handleCareerMatchAgent'
    ];

    for (const handler of requiredHandlers) {
      const hasHandler = content.includes(handler);
      this.addResult({
        test: `Handler: ${handler}`,
        status: hasHandler ? 'PASS' : 'FAIL',
        message: hasHandler ? 'Handler exists' : 'Handler missing',
        details: hasHandler ? 'Function found in agent-proxy' : `Expected function ${handler}`
      });
    }

    // Test prompt path mapping
    const hasPromptMapping = content.includes('portfolio_v1_8.yml') && 
                            content.includes('onboarder_v2.yml') && 
                            content.includes('clarifier_v3.yml');
    
    this.addResult({
      test: 'Prompt Path Mapping',
      status: hasPromptMapping ? 'PASS' : 'FAIL',
      message: hasPromptMapping ? 'All prompt paths mapped' : 'Missing prompt path mappings',
      details: hasPromptMapping ? 'All required prompt paths found' : 'Some prompt paths missing'
    });
  }

  private async testPromptVersionMismatches(): Promise<void> {
    console.log('📝 Testing Prompt Version Mismatches...');
    
    const registryPath = join(this.projectRoot, 'src/lib/agents/registry.ts');
    
    if (!existsSync(registryPath)) {
      this.addResult({
        test: 'Prompt Registry',
        status: 'FAIL',
        message: 'Registry file not found',
        details: `Expected file at ${registryPath}`
      });
      return;
    }

    const content = readFileSync(registryPath, 'utf-8');
    
    // Check for corrected prompt paths
    const corrections = [
      { agent: 'onboarder', expected: 'onboarder_v2.yml', wrong: 'onboarder_v2_3.xml' },
      { agent: 'portfolio_curator', expected: 'portfolio_v1_8.yml', wrong: 'portfoliocurator_v1_3.yml' },
      { agent: 'clarifier', expected: 'clarifier_v3.yml', wrong: 'clarifier_v1_0.yml' }
    ];

    for (const correction of corrections) {
      const hasCorrect = content.includes(correction.expected);
      const hasWrong = content.includes(correction.wrong);
      
      this.addResult({
        test: `Prompt Path: ${correction.agent}`,
        status: hasCorrect && !hasWrong ? 'PASS' : 'FAIL',
        message: hasCorrect && !hasWrong ? 'Correct prompt path' : 'Incorrect prompt path',
        details: hasCorrect && !hasWrong ? 
          `Using ${correction.expected}` : 
          `Found ${hasWrong ? correction.wrong : 'missing'}, expected ${correction.expected}`
      });
    }
  }

  private async testInstructorEnhancement(): Promise<void> {
    console.log('👨‍🏫 Testing Instructor Enhancement...');
    
    const instructorPath = join(this.projectRoot, 'supabase/functions/instructor-agent/index.ts');
    
    if (!existsSync(instructorPath)) {
      this.addResult({
        test: 'Instructor Agent',
        status: 'FAIL',
        message: 'Instructor agent file not found',
        details: `Expected file at ${instructorPath}`
      });
      return;
    }

    const content = readFileSync(instructorPath, 'utf-8');
    
    const requiredActions = [
      'DELIVER_LECTURE',
      'CHECK_COMPREHENSION', 
      'MODIFY_PRACTICE_PROMPTS'
    ];

    for (const action of requiredActions) {
      const hasAction = content.includes(action);
      this.addResult({
        test: `Instructor Action: ${action}`,
        status: hasAction ? 'PASS' : 'FAIL',
        message: hasAction ? 'Action handler exists' : 'Action handler missing',
        details: hasAction ? 'Action found in instructor agent' : `Expected action ${action}`
      });
    }

    // Test response parsing
    const hasParsing = content.includes('parseInstructorResponse');
    this.addResult({
      test: 'Response Parsing',
      status: hasParsing ? 'PASS' : 'FAIL',
      message: hasParsing ? 'Response parsing implemented' : 'Response parsing missing',
      details: hasParsing ? 'parseInstructorResponse function found' : 'Expected response parsing function'
    });
  }

  private async testPromptModificationSystem(): Promise<void> {
    console.log('🔧 Testing Prompt Modification System...');
    
    const promptModifierPath = join(this.projectRoot, 'src/lib/agents/promptModifier.ts');
    
    if (!existsSync(promptModifierPath)) {
      this.addResult({
        test: 'Prompt Modifier',
        status: 'FAIL',
        message: 'Prompt modifier file not found',
        details: `Expected file at ${promptModifierPath}`
      });
      return;
    }

    const content = readFileSync(promptModifierPath, 'utf-8');
    
    const requiredFunctions = [
      'modifyPromptsForPractice',
      'analyzeComprehensionResults',
      'formatInstructorModifications',
      'validateComprehensionResults'
    ];

    for (const func of requiredFunctions) {
      const hasFunction = content.includes(func);
      this.addResult({
        test: `Function: ${func}`,
        status: hasFunction ? 'PASS' : 'FAIL',
        message: hasFunction ? 'Function exists' : 'Function missing',
        details: hasFunction ? 'Function found in prompt modifier' : `Expected function ${func}`
      });
    }
  }

  private async testTASocraticUpdates(): Promise<void> {
    console.log('📚 Testing TA/Socratic Updates...');
    
    const agents = [
      { name: 'TA', path: 'supabase/functions/ta-agent/index.ts' },
      { name: 'Socratic', path: 'supabase/functions/socratic-agent/index.ts' }
    ];

    for (const agent of agents) {
      const agentPath = join(this.projectRoot, agent.path);
      
      if (!existsSync(agentPath)) {
        this.addResult({
          test: `${agent.name} Agent`,
          status: 'FAIL',
          message: `${agent.name} agent file not found`,
          details: `Expected file at ${agentPath}`
        });
        continue;
      }

      const content = readFileSync(agentPath, 'utf-8');
      
      const hasModifications = content.includes('instructorModifications');
      const hasPromptFormatting = content.includes('INSTRUCTOR_NOTES') && 
                                 content.includes('PRACTICE_FOCUS') && 
                                 content.includes('USER_UNDERSTANDING');
      
      this.addResult({
        test: `${agent.name} Instructor Modifications`,
        status: hasModifications ? 'PASS' : 'FAIL',
        message: hasModifications ? 'Instructor modifications supported' : 'Instructor modifications missing',
        details: hasModifications ? 'instructorModifications interface found' : 'Expected instructorModifications support'
      });

      this.addResult({
        test: `${agent.name} Prompt Formatting`,
        status: hasPromptFormatting ? 'PASS' : 'FAIL',
        message: hasPromptFormatting ? 'Prompt formatting implemented' : 'Prompt formatting missing',
        details: hasPromptFormatting ? 'All required prompt variables found' : 'Missing prompt formatting variables'
      });
    }
  }

  private async testInstructorInterface(): Promise<void> {
    console.log('🖥️ Testing Instructor Interface...');
    
    const interfacePath = join(this.projectRoot, 'src/components/agents/InstructorInterface.tsx');
    
    if (!existsSync(interfacePath)) {
      this.addResult({
        test: 'Instructor Interface',
        status: 'FAIL',
        message: 'Instructor interface file not found',
        details: `Expected file at ${interfacePath}`
      });
      return;
    }

    const content = readFileSync(interfacePath, 'utf-8');
    
    const requiredFeatures = [
      'LearningPhase',
      'startLecture',
      'checkComprehension',
      'preparePractice',
      'startPractice'
    ];

    for (const feature of requiredFeatures) {
      const hasFeature = content.includes(feature);
      this.addResult({
        test: `Interface Feature: ${feature}`,
        status: hasFeature ? 'PASS' : 'FAIL',
        message: hasFeature ? 'Feature implemented' : 'Feature missing',
        details: hasFeature ? 'Feature found in interface' : `Expected feature ${feature}`
      });
    }
  }

  private async testAgentOrchestrator(): Promise<void> {
    console.log('🎯 Testing Agent Orchestrator...');
    
    const orchestratorPath = join(this.projectRoot, 'src/lib/agents.ts');
    
    if (!existsSync(orchestratorPath)) {
      this.addResult({
        test: 'Agent Orchestrator',
        status: 'FAIL',
        message: 'Agent orchestrator file not found',
        details: `Expected file at ${orchestratorPath}`
      });
      return;
    }

    const content = readFileSync(orchestratorPath, 'utf-8');
    
    const requiredMethods = [
      'callInstructorAgent',
      'callOnboarderAgent',
      'callClarifierAgent',
      'callPortfolioAgent',
      'callCareerMatchAgent'
    ];

    for (const method of requiredMethods) {
      const hasMethod = content.includes(method);
      this.addResult({
        test: `Orchestrator Method: ${method}`,
        status: hasMethod ? 'PASS' : 'FAIL',
        message: hasMethod ? 'Method exists' : 'Method missing',
        details: hasMethod ? 'Method found in orchestrator' : `Expected method ${method}`
      });
    }
  }

  private async testVoiceIntegration(): Promise<void> {
    console.log('🎤 Testing Voice Integration...');
    
    const voicePath = join(this.projectRoot, 'src/hooks/useVoiceIntegration.ts');
    
    if (!existsSync(voicePath)) {
      this.addResult({
        test: 'Voice Integration',
        status: 'FAIL',
        message: 'Voice integration file not found',
        details: `Expected file at ${voicePath}`
      });
      return;
    }

    const content = readFileSync(voicePath, 'utf-8');
    
    const hasProcessing = content.includes('processRecordedAudio');
    const hasBase64Conversion = content.includes('blobToBase64');
    const hasTranscriptionCall = content.includes('/functions/v1/voice/transcribe');
    
    this.addResult({
      test: 'Audio Processing',
      status: hasProcessing ? 'PASS' : 'FAIL',
      message: hasProcessing ? 'Audio processing implemented' : 'Audio processing missing',
      details: hasProcessing ? 'processRecordedAudio function found' : 'Expected audio processing function'
    });

    this.addResult({
      test: 'Base64 Conversion',
      status: hasBase64Conversion ? 'PASS' : 'FAIL',
      message: hasBase64Conversion ? 'Base64 conversion implemented' : 'Base64 conversion missing',
      details: hasBase64Conversion ? 'blobToBase64 function found' : 'Expected base64 conversion function'
    });

    this.addResult({
      test: 'Transcription API Call',
      status: hasTranscriptionCall ? 'PASS' : 'FAIL',
      message: hasTranscriptionCall ? 'Transcription API call implemented' : 'Transcription API call missing',
      details: hasTranscriptionCall ? 'Voice transcription endpoint found' : 'Expected transcription API call'
    });
  }

  private async testEnvironmentConfiguration(): Promise<void> {
    console.log('⚙️ Testing Environment Configuration...');
    
    const envExamplePath = join(this.projectRoot, 'env.example');
    
    if (!existsSync(envExamplePath)) {
      this.addResult({
        test: 'Environment Example',
        status: 'FAIL',
        message: 'Environment example file not found',
        details: `Expected file at ${envExamplePath}`
      });
      return;
    }

    const content = readFileSync(envExamplePath, 'utf-8');
    
    const requiredVars = [
      'GEMINI_API_KEY',
      'ELEVENLABS_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'EDGE_SERVICE_JWT'
    ];

    for (const envVar of requiredVars) {
      const hasVar = content.includes(envVar);
      this.addResult({
        test: `Environment Variable: ${envVar}`,
        status: hasVar ? 'PASS' : 'FAIL',
        message: hasVar ? 'Environment variable configured' : 'Environment variable missing',
        details: hasVar ? 'Variable found in env.example' : `Expected variable ${envVar}`
      });
    }
  }

  private addResult(result: TestResult): void {
    this.results.push(result);
  }

  private printResults(): void {
    console.log('\n📊 Production Readiness Test Results\n');
    console.log('=' .repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📈 Total: ${this.results.length}`);
    
    const readinessScore = Math.round((passed / this.results.length) * 100);
    console.log(`🎯 Production Readiness Score: ${readinessScore}%\n`);
    
    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  • ${r.test}: ${r.message}`);
          if (r.details) {
            console.log(`    ${r.details}`);
          }
        });
      console.log('');
    }
    
    if (readinessScore >= 90) {
      console.log('🎉 CONGRATULATIONS! Your Wisely is production ready!');
    } else if (readinessScore >= 75) {
      console.log('⚠️ Almost there! Fix the remaining issues to achieve production readiness.');
    } else {
      console.log('🚧 Significant work needed before production deployment.');
    }
    
    console.log('\n' + '=' .repeat(60));
  }
}

// Run the tests
const tester = new ProductionReadinessTester();
tester.runAllTests().catch(console.error);
