#!/usr/bin/env ts-node

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'

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

const trackConfigs = {
  ai_ml: {
    label: 'AI/ML Engineering',
    description: 'Comprehensive AI and Machine Learning track for aspiring ML engineers',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'Basic Python programming',
        'Fundamental ML concepts',
        'Data preprocessing',
        'Simple model training'
      ],
      intermediate: [
        'Advanced ML algorithms',
        'Deep learning basics',
        'Model deployment',
        'MLOps fundamentals'
      ],
      expert: [
        'Advanced deep learning',
        'ML system design',
        'Research and innovation',
        'Production ML pipelines'
      ]
    },
    monthGoals: {
      1: { focus: 'Python and ML basics', target: 'Complete first ML project' },
      2: { focus: 'Data preprocessing', target: 'Build data pipeline' },
      3: { focus: 'Model training', target: 'Deploy first model' }
    }
  },
  fullstack_web: {
    label: 'Fullstack Web Development',
    description: 'Complete web development track covering frontend, backend, and deployment',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'HTML, CSS, JavaScript basics',
        'Responsive design principles',
        'Basic server-side programming',
        'Database fundamentals'
      ],
      intermediate: [
        'Modern JavaScript frameworks',
        'API design and development',
        'Database optimization',
        'Cloud deployment'
      ],
      expert: [
        'System architecture design',
        'Performance optimization',
        'Security best practices',
        'Scalable infrastructure'
      ]
    },
    monthGoals: {
      1: { focus: 'Frontend fundamentals', target: 'Build responsive website' },
      2: { focus: 'Backend development', target: 'Create REST API' },
      3: { focus: 'Fullstack integration', target: 'Deploy complete application' }
    }
  },
  data_eng: {
    label: 'Data Engineering',
    description: 'Data infrastructure and pipeline development for scalable data systems',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'SQL fundamentals',
        'Data modeling basics',
        'ETL concepts',
        'Basic data pipelines'
      ],
      intermediate: [
        'Advanced SQL and NoSQL',
        'Data pipeline orchestration',
        'Cloud data platforms',
        'Data quality and testing'
      ],
      expert: [
        'Distributed data systems',
        'Real-time processing',
        'Data architecture design',
        'Performance optimization'
      ]
    },
    monthGoals: {
      1: { focus: 'SQL and data modeling', target: 'Design database schema' },
      2: { focus: 'ETL pipelines', target: 'Build data pipeline' },
      3: { focus: 'Cloud platforms', target: 'Deploy to cloud' }
    }
  },
  devops: {
    label: 'DevOps Engineering',
    description: 'Infrastructure automation and deployment pipeline development',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'Linux fundamentals',
        'Version control with Git',
        'Basic scripting',
        'CI/CD concepts'
      ],
      intermediate: [
        'Containerization with Docker',
        'Infrastructure as Code',
        'Cloud platforms',
        'Monitoring and logging'
      ],
      expert: [
        'Kubernetes orchestration',
        'Security and compliance',
        'Performance optimization',
        'Disaster recovery'
      ]
    },
    monthGoals: {
      1: { focus: 'Linux and Git', target: 'Set up development environment' },
      2: { focus: 'Docker and containers', target: 'Containerize application' },
      3: { focus: 'CI/CD pipelines', target: 'Automate deployment' }
    }
  },
  cybersecurity: {
    label: 'Cybersecurity',
    description: 'Security analysis, threat detection, and defensive programming',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'Security fundamentals',
        'Network basics',
        'Threat modeling',
        'Basic penetration testing'
      ],
      intermediate: [
        'Advanced penetration testing',
        'Incident response',
        'Security tools and frameworks',
        'Vulnerability assessment'
      ],
      expert: [
        'Reverse engineering',
        'Malware analysis',
        'Security architecture',
        'Threat intelligence'
      ]
    },
    monthGoals: {
      1: { focus: 'Security fundamentals', target: 'Complete security assessment' },
      2: { focus: 'Penetration testing', target: 'Conduct security audit' },
      3: { focus: 'Incident response', target: 'Handle security incident' }
    }
  },
  product_mgmt: {
    label: 'Product Management',
    description: 'Product strategy, user research, and stakeholder management',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'Product fundamentals',
        'User research basics',
        'Market analysis',
        'Requirements gathering'
      ],
      intermediate: [
        'Data-driven decision making',
        'Stakeholder management',
        'Product strategy',
        'Agile methodologies'
      ],
      expert: [
        'Product vision and strategy',
        'Team leadership',
        'Go-to-market strategy',
        'Product portfolio management'
      ]
    },
    monthGoals: {
      1: { focus: 'Product fundamentals', target: 'Define product vision' },
      2: { focus: 'User research', target: 'Conduct user interviews' },
      3: { focus: 'Product strategy', target: 'Create product roadmap' }
    }
  },
  ux_design: {
    label: 'UX Design',
    description: 'User experience design, research, and interface development',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'Design fundamentals',
        'User research basics',
        'Wireframing and prototyping',
        'Usability principles'
      ],
      intermediate: [
        'Advanced user research',
        'Design systems',
        'Interaction design',
        'Usability testing'
      ],
      expert: [
        'Design strategy',
        'Research methodology',
        'Design leadership',
        'Innovation and trends'
      ]
    },
    monthGoals: {
      1: { focus: 'Design fundamentals', target: 'Create wireframes' },
      2: { focus: 'User research', target: 'Conduct usability study' },
      3: { focus: 'Design systems', target: 'Build design system' }
    }
  },
  ai_ethics: {
    label: 'AI Ethics',
    description: 'Ethical AI development, bias detection, and responsible AI practices',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'AI ethics fundamentals',
        'Bias detection basics',
        'Privacy principles',
        'Fairness concepts'
      ],
      intermediate: [
        'Algorithmic fairness',
        'Privacy protection',
        'Transparency methods',
        'Ethical frameworks'
      ],
      expert: [
        'Policy development',
        'Ethical AI governance',
        'Research methodology',
        'Industry standards'
      ]
    },
    monthGoals: {
      1: { focus: 'AI ethics fundamentals', target: 'Audit AI system' },
      2: { focus: 'Bias detection', target: 'Implement fairness measures' },
      3: { focus: 'Privacy protection', target: 'Design privacy-first system' }
    }
  },
  tech_writing: {
    label: 'Technical Writing',
    description: 'Technical documentation, content strategy, and user experience writing',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'Writing fundamentals',
        'Technical communication',
        'Documentation basics',
        'User guides'
      ],
      intermediate: [
        'Content strategy',
        'Information architecture',
        'User experience writing',
        'API documentation'
      ],
      expert: [
        'Content management',
        'Knowledge management',
        'Writing leadership',
        'Content automation'
      ]
    },
    monthGoals: {
      1: { focus: 'Writing fundamentals', target: 'Create user guide' },
      2: { focus: 'Technical documentation', target: 'Write API docs' },
      3: { focus: 'Content strategy', target: 'Develop content plan' }
    }
  },
  game_dev: {
    label: 'Game Development',
    description: 'Game programming, design principles, and interactive media development',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'Game programming basics',
        'Game design principles',
        'Graphics fundamentals',
        'Physics simulation'
      ],
      intermediate: [
        'Game engines',
        'Multiplayer development',
        'Performance optimization',
        'Audio programming'
      ],
      expert: [
        'Game architecture',
        'Advanced graphics',
        'AI in games',
        'Platform optimization'
      ]
    },
    monthGoals: {
      1: { focus: 'Game programming basics', target: 'Create simple game' },
      2: { focus: 'Game engines', target: 'Build 3D game' },
      3: { focus: 'Multiplayer development', target: 'Create multiplayer game' }
    }
  },
  blockchain: {
    label: 'Blockchain Development',
    description: 'Blockchain technology, smart contracts, and decentralized applications',
    levels: ['beginner', 'intermediate', 'expert'],
    competencies: {
      beginner: [
        'Blockchain fundamentals',
        'Cryptography basics',
        'Smart contracts intro',
        'Web3 basics'
      ],
      intermediate: [
        'DeFi protocols',
        'Consensus mechanisms',
        'Smart contract security',
        'DApp development'
      ],
      expert: [
        'Protocol design',
        'Scalability solutions',
        'Cross-chain development',
        'Blockchain architecture'
      ]
    },
    monthGoals: {
      1: { focus: 'Blockchain fundamentals', target: 'Deploy smart contract' },
      2: { focus: 'DeFi protocols', target: 'Build DeFi application' },
      3: { focus: 'DApp development', target: 'Create full DApp' }
    }
  }
}

async function createTrackConfigs() {
  console.log('🚀 Creating track configurations for all tracks...')
  
  // Create tracks directory if it doesn't exist
  const tracksDir = path.join(process.cwd(), 'tracks')
  if (!fs.existsSync(tracksDir)) {
    fs.mkdirSync(tracksDir, { recursive: true })
  }
  
  let createdCount = 0
  
  for (const track of tracks) {
    const trackDir = path.join(tracksDir, track)
    if (!fs.existsSync(trackDir)) {
      fs.mkdirSync(trackDir, { recursive: true })
    }
    
    const config = trackConfigs[track as keyof typeof trackConfigs]
    if (!config) {
      console.warn(`⚠️  No config found for track: ${track}`)
      continue
    }
    
    // Create config.yaml
    const configPath = path.join(trackDir, 'config.yaml')
    const configContent = yaml.stringify(config)
    
    try {
      fs.writeFileSync(configPath, configContent)
      console.log(`✅ Created: ${track}/config.yaml`)
      createdCount++
    } catch (error) {
      console.error(`❌ Failed to create ${configPath}:`, error)
    }
    
    // Create schema.json
    const schemaPath = path.join(trackDir, 'schema.json')
    const schema = {
      type: 'object',
      properties: {
        label: { type: 'string' },
        description: { type: 'string' },
        levels: { type: 'array', items: { type: 'string' } },
        competencies: { type: 'object' },
        monthGoals: { type: 'object' }
      },
      required: ['label', 'description', 'levels', 'competencies', 'monthGoals']
    }
    
    try {
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2))
      console.log(`✅ Created: ${track}/schema.json`)
    } catch (error) {
      console.error(`❌ Failed to create ${schemaPath}:`, error)
    }
  }
  
  console.log(`\n📊 Summary: Created ${createdCount} track configurations`)
  console.log(`📁 Tracks: ${tracks.length}`)
  console.log(`📄 Total files: ${tracks.length * 2}`)
}

// Run the script
createTrackConfigs().catch(console.error) 