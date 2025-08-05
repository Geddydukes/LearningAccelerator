#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'
import { parse } from 'yaml'
import * as fs from 'fs'
import * as path from 'path'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jclgmvbkrlkppecwnljv.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface TrackConfig {
  label: string
  description: string
  levels: string[]
  competencies: Record<string, string[]>
  monthGoals: Record<string, any>
  schema: any
}

async function validateTrackConfig(config: any): Promise<TrackConfig> {
  // Validate required fields
  if (!config.label) throw new Error('Missing label')
  if (!config.description) throw new Error('Missing description')
  if (!config.levels || !Array.isArray(config.levels)) throw new Error('Missing levels array')
  if (!config.competencies) throw new Error('Missing competencies')
  if (!config.monthGoals) throw new Error('Missing monthGoals')
  if (!config.schema) throw new Error('Missing schema')

  return config as TrackConfig
}

async function seedTrack(trackName: string, configPath: string) {
  try {
    console.log(`🌱 Seeding track: ${trackName}`)

    // Read and parse YAML config
    const configYaml = fs.readFileSync(configPath, 'utf8')
    const config = parse(configYaml)
    
    // Validate config structure
    const validatedConfig = await validateTrackConfig(config)
    
    // Upload config to tracks bucket
    const { error: configError } = await supabase.storage
      .from('tracks')
      .upload(`${trackName}/config.yaml`, configYaml, {
        contentType: 'application/yaml'
      })

    if (configError) {
      console.error(`❌ Failed to upload config for ${trackName}:`, configError)
      return false
    }

    // Upload schema to tracks bucket
    const schemaPath = path.join(path.dirname(configPath), 'schema.json')
    if (fs.existsSync(schemaPath)) {
      const schemaJson = fs.readFileSync(schemaPath, 'utf8')
      
      const { error: schemaError } = await supabase.storage
        .from('tracks')
        .upload(`${trackName}/schema.json`, schemaJson, {
          contentType: 'application/json'
        })

      if (schemaError) {
        console.error(`❌ Failed to upload schema for ${trackName}:`, schemaError)
        return false
      }
    }

    console.log(`✅ Successfully seeded track: ${trackName}`)
    return true

  } catch (error) {
    console.error(`❌ Error seeding track ${trackName}:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting track seeding process...')

  // Check if tracks directory exists
  const tracksDir = path.join(process.cwd(), 'tracks')
  if (!fs.existsSync(tracksDir)) {
    console.log('📁 Creating tracks directory...')
    fs.mkdirSync(tracksDir, { recursive: true })
  }

  // Seed default AI/ML track if it doesn't exist
  const aiMlConfigPath = path.join(tracksDir, 'ai_ml', 'config.yaml')
  
  if (!fs.existsSync(aiMlConfigPath)) {
    console.log('📝 Creating default AI/ML track configuration...')
    
    const aiMlDir = path.join(tracksDir, 'ai_ml')
    fs.mkdirSync(aiMlDir, { recursive: true })

    const defaultConfig = {
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
      },
      schema: {
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
    }

    // Write config file
    const yaml = require('yaml')
    fs.writeFileSync(aiMlConfigPath, yaml.stringify(defaultConfig))

    // Write schema file
    const schemaPath = path.join(aiMlDir, 'schema.json')
    fs.writeFileSync(schemaPath, JSON.stringify(defaultConfig.schema, null, 2))
  }

  // Seed all tracks in the tracks directory
  const trackDirs = fs.readdirSync(tracksDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  let successCount = 0
  let totalCount = 0

  for (const trackName of trackDirs) {
    const configPath = path.join(tracksDir, trackName, 'config.yaml')
    
    if (fs.existsSync(configPath)) {
      totalCount++
      const success = await seedTrack(trackName, configPath)
      if (success) successCount++
    } else {
      console.log(`⚠️  Skipping ${trackName}: no config.yaml found`)
    }
  }

  console.log(`\n📊 Seeding Summary:`)
  console.log(`✅ Successfully seeded: ${successCount}/${totalCount} tracks`)
  
  if (successCount === totalCount) {
    console.log('🎉 All tracks seeded successfully!')
    process.exit(0)
  } else {
    console.log('⚠️  Some tracks failed to seed')
    process.exit(1)
  }
}

// Run the seeding process
main().catch(console.error) 