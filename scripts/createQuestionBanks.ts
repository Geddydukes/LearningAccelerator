#!/usr/bin/env ts-node

import * as fs from 'fs'
import * as path from 'path'

const tracks = [
  'ai_ml',
  'fullstack_web', 
  'data_eng',
  'devops',
  'cybersecurity',
  'product_mgmt',
  'ux_design',
  'ai_ethics',
  'tech_writing',
  'game_dev',
  'blockchain'
]

const difficulties = ['beginner', 'intermediate', 'expert']

const trackCategories = {
  ai_ml: {
    beginner: ['machine_learning_basics', 'python_fundamentals', 'data_preprocessing'],
    intermediate: ['advanced_ml_concepts', 'deep_learning_basics', 'model_deployment'],
    expert: ['expert_ml_concepts', 'research_methods', 'production_systems']
  },
  fullstack_web: {
    beginner: ['web_fundamentals', 'html_css_basics', 'javascript_basics'],
    intermediate: ['advanced_web_concepts', 'backend_development', 'database_design'],
    expert: ['expert_web_concepts', 'system_architecture', 'performance_optimization']
  },
  data_eng: {
    beginner: ['data_fundamentals', 'sql_basics', 'etl_concepts'],
    intermediate: ['advanced_data_concepts', 'data_pipelines', 'cloud_platforms'],
    expert: ['expert_data_concepts', 'distributed_systems', 'data_architecture']
  },
  devops: {
    beginner: ['devops_fundamentals', 'linux_basics', 'version_control'],
    intermediate: ['advanced_devops_concepts', 'containerization', 'ci_cd_pipelines'],
    expert: ['expert_devops_concepts', 'infrastructure_as_code', 'monitoring_observability']
  },
  cybersecurity: {
    beginner: ['security_fundamentals', 'network_basics', 'threat_modeling'],
    intermediate: ['advanced_security_concepts', 'penetration_testing', 'incident_response'],
    expert: ['expert_security_concepts', 'reverse_engineering', 'security_architecture']
  },
  product_mgmt: {
    beginner: ['product_fundamentals', 'user_research', 'market_analysis'],
    intermediate: ['advanced_product_concepts', 'data_analytics', 'stakeholder_management'],
    expert: ['expert_product_concepts', 'product_strategy', 'team_leadership']
  },
  ux_design: {
    beginner: ['design_fundamentals', 'user_research_basics', 'wireframing'],
    intermediate: ['advanced_design_concepts', 'usability_testing', 'design_systems'],
    expert: ['expert_design_concepts', 'design_strategy', 'research_methods']
  },
  ai_ethics: {
    beginner: ['ethics_fundamentals', 'ai_basics', 'bias_detection'],
    intermediate: ['advanced_ethics_concepts', 'algorithmic_fairness', 'privacy_protection'],
    expert: ['expert_ethics_concepts', 'policy_development', 'ethical_frameworks']
  },
  tech_writing: {
    beginner: ['writing_fundamentals', 'technical_communication', 'documentation_basics'],
    intermediate: ['advanced_writing_concepts', 'content_strategy', 'user_experience_writing'],
    expert: ['expert_writing_concepts', 'information_architecture', 'content_management']
  },
  game_dev: {
    beginner: ['game_fundamentals', 'programming_basics', 'game_design_principles'],
    intermediate: ['advanced_game_concepts', 'game_engines', 'multiplayer_development'],
    expert: ['expert_game_concepts', 'game_architecture', 'performance_optimization']
  },
  blockchain: {
    beginner: ['blockchain_fundamentals', 'cryptography_basics', 'smart_contracts_intro'],
    intermediate: ['advanced_blockchain_concepts', 'defi_protocols', 'consensus_mechanisms'],
    expert: ['expert_blockchain_concepts', 'protocol_design', 'scalability_solutions']
  }
}

function generateQuestionBankContent(track: string, difficulty: string): string {
  const categories = trackCategories[track as keyof typeof trackCategories]?.[difficulty as keyof typeof trackCategories.ai_ml] || ['general_concepts']
  
  return `# ${track.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Question Bank
# This file will be populated with structured questions for the Socratic agent
# Format: YAML with categories and difficulty levels

questions:
${categories.map(category => `  - category: "${category}"
    difficulty: "${difficulty}"
    questions: []
    # Will be populated with actual questions`).join('\n')}
`
}

async function createQuestionBanks() {
  console.log('🚀 Creating question banks for all tracks...')
  
  let createdCount = 0
  
  for (const track of tracks) {
    for (const difficulty of difficulties) {
      const filePath = path.join(process.cwd(), 'questionBank', track, `${difficulty}.yaml`)
      const content = generateQuestionBankContent(track, difficulty)
      
      try {
        fs.writeFileSync(filePath, content)
        console.log(`✅ Created: ${track}/${difficulty}.yaml`)
        createdCount++
      } catch (error) {
        console.error(`❌ Failed to create ${filePath}:`, error)
      }
    }
  }
  
  console.log(`\n📊 Summary: Created ${createdCount} question bank files`)
  console.log(`📁 Tracks: ${tracks.length}`)
  console.log(`📚 Difficulties: ${difficulties.length}`)
  console.log(`📄 Total files: ${tracks.length * difficulties.length}`)
}

// Run the script
createQuestionBanks().catch(console.error) 