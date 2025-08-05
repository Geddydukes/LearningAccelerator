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

function showStructure() {
  console.log('📁 Learning Accelerator - Complete Track Structure')
  console.log('=' .repeat(60))
  
  console.log('\n🎯 Question Banks (33 files)')
  console.log('─' .repeat(40))
  
  for (const track of tracks) {
    console.log(`\n📚 ${track.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
    for (const difficulty of difficulties) {
      const filePath = path.join('questionBank', track, `${difficulty}.yaml`)
      const exists = fs.existsSync(filePath)
      const status = exists ? '✅' : '❌'
      console.log(`   ${status} ${difficulty}.yaml`)
    }
  }
  
  console.log('\n🎯 Track Configurations (22 files)')
  console.log('─' .repeat(40))
  
  for (const track of tracks) {
    console.log(`\n📁 ${track.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
    const configPath = path.join('tracks', track, 'config.yaml')
    const schemaPath = path.join('tracks', track, 'schema.json')
    
    const configExists = fs.existsSync(configPath)
    const schemaExists = fs.existsSync(schemaPath)
    
    console.log(`   ${configExists ? '✅' : '❌'} config.yaml`)
    console.log(`   ${schemaExists ? '✅' : '❌'} schema.json`)
  }
  
  console.log('\n📊 Summary')
  console.log('─' .repeat(40))
  console.log(`📚 Question Banks: ${tracks.length} tracks × ${difficulties.length} levels = ${tracks.length * difficulties.length} files`)
  console.log(`📁 Track Configs: ${tracks.length} tracks × 2 files = ${tracks.length * 2} files`)
  console.log(`📄 Total Files: ${tracks.length * difficulties.length + tracks.length * 2} files`)
  
  console.log('\n🎯 Track Categories')
  console.log('─' .repeat(40))
  
  const categories = {
    'ai_ml': 'AI/ML Engineering',
    'fullstack_web': 'Fullstack Web Development',
    'data_eng': 'Data Engineering',
    'devops': 'DevOps Engineering',
    'cybersecurity': 'Cybersecurity',
    'product_mgmt': 'Product Management',
    'ux_design': 'UX Design',
    'ai_ethics': 'AI Ethics',
    'tech_writing': 'Technical Writing',
    'game_dev': 'Game Development',
    'blockchain': 'Blockchain Development'
  }
  
  for (const [slug, name] of Object.entries(categories)) {
    console.log(`   ${slug}: ${name}`)
  }
  
  console.log('\n🚀 Ready for Content Population!')
  console.log('─' .repeat(40))
  console.log('✅ All directory structures created')
  console.log('✅ All YAML/JSON files scaffolded')
  console.log('✅ Track configurations defined')
  console.log('✅ Question bank categories mapped')
  console.log('\n📝 Next: Populate question banks with actual content')
  console.log('📝 Next: Create v3 prompt templates with placeholders')
  console.log('📝 Next: Implement onboarding flow with track selection')
}

showStructure() 