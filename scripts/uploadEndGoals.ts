#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Supabase configuration
const supabaseUrl = 'https://jclgmvbkrlkppecwnljv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbGdtdmJrcmxrcHBlY3dubGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTU5ODYsImV4cCI6MjA2ODUzMTk4Nn0.BQUBTydxPfOz17ZF-I3P3Xg5qwI9dcs6TDpJHKIhggg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function uploadEndGoals() {
  console.log('🚀 Uploading end-goal samples to Supabase Storage...')
  
  try {
    // Read the end-goal samples file
    const filePath = path.join(process.cwd(), 'seed-data', 'onboarding', 'end-goal-samples.txt')
    const content = fs.readFileSync(filePath, 'utf8')
    
    console.log('📄 Reading end-goal samples...')
    console.log(`📊 Content length: ${content.length} characters`)
    
    // Create structured JSON content
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
    
    // Upload text version
    console.log('📤 Uploading text version...')
    const { data: textData, error: textError } = await supabase.storage
      .from('prompts-compiled')
      .upload('onboarding/end-goal-samples.txt', content, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (textError) {
      console.error('❌ Failed to upload text version:', textError)
    } else {
      console.log('✅ Successfully uploaded text version')
      console.log(`📁 Path: prompts-compiled/onboarding/end-goal-samples.txt`)
    }
    
    // Upload JSON version
    console.log('📤 Uploading JSON version...')
    const { data: jsonData, error: jsonError } = await supabase.storage
      .from('prompts-compiled')
      .upload('onboarding/end-goal-samples.json', JSON.stringify(jsonContent, null, 2), {
        contentType: 'application/json',
        upsert: true
      })
    
    if (jsonError) {
      console.error('❌ Failed to upload JSON version:', jsonError)
    } else {
      console.log('✅ Successfully uploaded JSON version')
      console.log(`📁 Path: prompts-compiled/onboarding/end-goal-samples.json`)
    }
    
    // Generate signed URLs for frontend access
    console.log('🔗 Generating signed URLs...')
    
    const { data: textUrl, error: textUrlError } = await supabase.storage
      .from('prompts-compiled')
      .createSignedUrl('onboarding/end-goal-samples.txt', 3600)
    
    if (textUrlError) {
      console.error('❌ Failed to generate text URL:', textUrlError)
    } else {
      console.log('✅ Text file signed URL generated')
      console.log(`📎 URL: ${textUrl.signedUrl}`)
    }
    
    const { data: jsonUrl, error: jsonUrlError } = await supabase.storage
      .from('prompts-compiled')
      .createSignedUrl('onboarding/end-goal-samples.json', 3600)
    
    if (jsonUrlError) {
      console.error('❌ Failed to generate JSON URL:', jsonUrlError)
    } else {
      console.log('✅ JSON file signed URL generated')
      console.log(`📎 URL: ${jsonUrl.signedUrl}`)
    }
    
    console.log('\n🎉 End-goal samples upload complete!')
    console.log('📝 Frontend can now fetch end-goal samples from Supabase Storage')
    console.log('🔧 Use the JSON version for structured access in the onboarding flow')
    
  } catch (error) {
    console.error('❌ Error uploading end-goal samples:', error)
    process.exit(1)
  }
}

// Run the upload
uploadEndGoals().catch(console.error) 