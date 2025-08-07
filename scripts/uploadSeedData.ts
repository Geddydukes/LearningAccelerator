#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'
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

async function uploadSeedData() {
  console.log('🚀 Uploading seed data to Supabase Storage...')
  
  try {
    // Read the end-goal samples file
    const filePath = path.join(process.cwd(), 'seed-data', 'onboarding', 'end-goal-samples.txt')
    const content = fs.readFileSync(filePath, 'utf8')
    
    console.log('📄 Reading end-goal samples...')
    console.log(`📊 Content length: ${content.length} characters`)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('prompts-compiled')
      .upload('onboarding/end-goal-samples.txt', content, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (error) {
      console.error('❌ Failed to upload end-goal samples:', error)
      process.exit(1)
    }
    
    console.log('✅ Successfully uploaded end-goal samples to Supabase Storage')
    console.log(`📁 Path: prompts-compiled/onboarding/end-goal-samples.txt`)
    
    // Get a signed URL for frontend access
    const { data: urlData, error: urlError } = await supabase.storage
      .from('prompts-compiled')
      .createSignedUrl('onboarding/end-goal-samples.txt', 3600) // 1 hour
    
    if (urlError) {
      console.error('❌ Failed to generate signed URL:', urlError)
    } else {
      console.log('🔗 Signed URL generated for frontend access')
      console.log(`📎 URL: ${urlData.signedUrl}`)
    }
    
    // Also upload as JSON for easier parsing
    const jsonContent = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      tracks: {
        'ai_ml': {
          title: 'AI / ML Engineer & Researcher',
          goals: {
            '6mo': 'Build, containerise, and deploy a transformer-based summarisation API on AWS GPU instances with CI/CD, tests, and monitoring; leverage the project to secure a mid-level ML engineer role.',
            '12mo': 'Publish a parameter-efficient fine-tuning paper at NeurIPS **or** open-source a model that ranks top-1 % on SuperGLUE and gains ≥ 3 k GitHub stars.'
          }
        },
        'blockchain': {
          title: 'Blockchain & Smart Contracts',
          goals: {
            '6mo': 'Design, audit (Slither + MythX), and deploy an ERC-721A NFT contract with a secure mint dApp; land a smart-contract engineer position.',
            '12mo': 'Launch a Layer-2 or DeFi protocol exceeding $25 M TVL, cited by Messari—placing you in the ecosystem\'s top-tier contributors.'
          }
        },
        'cybersecurity': {
          title: 'Cybersecurity',
          goals: {
            '6mo': 'Earn CompTIA Security+ and build SIEM rule-sets that detect an ATT&CK chain; join a Tier-1 SOC analyst team.',
            '12mo': 'Achieve OSCP & OSCE3, rank top-100 on Hack-The-Box Pro, and publish a novel exploit CVE write-up referenced by MITRE.'
          }
        },
        'data_eng': {
          title: 'Data Engineering',
          goals: {
            '6mo': 'Implement Kafka → Flink → Iceberg pipeline with dbt & Great Expectations; obtain a Data Engineer role.',
            '12mo': 'Architect a petabyte-scale lakehouse adopted company-wide; present at Data + AI Summit as principal data architect.'
          }
        },
        'devops': {
          title: 'DevOps / Cloud Engineering',
          goals: {
            '6mo': 'Deploy blue-green GitOps Kubernetes (Argo CD) with SLO dashboards; step into an SRE position.',
            '12mo': 'Design a multi-region platform hitting 99.99 % uptime & <100 ms global P95 latency; keynote at KubeCon.'
          }
        },
        'fullstack_web': {
          title: 'Full-Stack Web Development',
          goals: {
            '6mo': 'Ship a production SaaS (Next 14, Prisma, Stripe) scoring ≥ 90 Lighthouse PWA; secure a full-stack dev role.',
            '12mo': 'Grow to 10 k MAU and open-source its UI kit (> 5 k stars); invited speaker at ReactConf.'
          }
        },
        'game_dev': {
          title: 'Game Development',
          goals: {
            '6mo': 'Release a Unity game on Steam with "Very Positive" reviews; join an indie studio.',
            '12mo': 'Launch a cross-platform title exceeding 1 M downloads and win an IndieCade award.'
          }
        },
        'product_mgmt': {
          title: 'Product Management',
          goals: {
            '6mo': 'Launch an MVP that lifts activation 20 %; step into an Associate PM role.',
            '12mo': 'Drive a product line to $1 M ARR; keynote Product-Led Summit.'
          }
        },
        'tech_writing': {
          title: 'Technical Writing',
          goals: {
            '6mo': 'Convert REST API docs to docs-as-code (OpenAPI, Hugo, Vale); become a documentation engineer.',
            '12mo': 'Publish a best-selling O\'Reilly book **or** win Write-the-Docs "Best Contribution".'
          }
        },
        'ux_design': {
          title: 'UX / UI Design',
          goals: {
            '6mo': 'Redesign a SaaS dashboard to WCAG AA, boosting conversion 20 %; get hired as Product Designer.',
            '12mo': 'Win an Awwwards "Site of the Day" and release a design-token library adopted by Fortune 500 teams.'
          }
        },
        'ai_ethics': {
          title: 'AI Ethics & Policy',
          goals: {
            '6mo': 'Deploy fairness dashboards and complete a Responsible-AI audit; become an RA advisor.',
            '12mo': 'Draft an Algorithmic Impact Assessment cited in national legislation and serve on an IEEE standards body.'
          }
        }
      }
    }
    
    const { data: jsonData, error: jsonError } = await supabase.storage
      .from('prompts-compiled')
      .upload('onboarding/end-goal-samples.json', JSON.stringify(jsonContent, null, 2), {
        contentType: 'application/json',
        upsert: true
      })
    
    if (jsonError) {
      console.error('❌ Failed to upload JSON version:', jsonError)
    } else {
      console.log('✅ Successfully uploaded JSON version for structured access')
      console.log(`📁 Path: prompts-compiled/onboarding/end-goal-samples.json`)
    }
    
    console.log('\n🎉 Seed data upload complete!')
    console.log('📝 Frontend can now fetch end-goal samples from Supabase Storage')
    
  } catch (error) {
    console.error('❌ Error uploading seed data:', error)
    process.exit(1)
  }
}

// Run the upload
uploadSeedData().catch(console.error) 