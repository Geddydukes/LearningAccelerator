#!/usr/bin/env ts-node

/**
 * Unified Prompt Sync Script
 * 
 * This script consolidates all prompt management operations:
 * - Upload prompts to Supabase Storage
 * - Sync prompts between local and remote
 * - Validate prompt versions
 * - Update agent registry
 * 
 * Replaces: upload-prompts.js, sync-prompts.sh, uploadPrompts.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
interface PromptSyncConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  promptsDir: string;
  storageBucket: string;
  dryRun: boolean;
  validateVersions: boolean;
  updateRegistry: boolean;
}

interface PromptFile {
  name: string;
  path: string;
  content: string;
  version: string;
  agent: string;
}

interface SyncResult {
  uploaded: string[];
  skipped: string[];
  errors: Array<{ file: string; error: string }>;
  summary: {
    total: number;
    uploaded: number;
    skipped: number;
    errors: number;
  };
}

class PromptSyncManager {
  private config: PromptSyncConfig;
  private supabase: any;

  constructor(config: PromptSyncConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  async sync(): Promise<SyncResult> {
    console.log('🚀 Starting prompt sync...');
    
    const result: SyncResult = {
      uploaded: [],
      skipped: [],
      errors: [],
      summary: { total: 0, uploaded: 0, skipped: 0, errors: 0 }
    };

    try {
      // Load all prompt files
      const promptFiles = await this.loadPromptFiles();
      result.summary.total = promptFiles.length;

      console.log(`📁 Found ${promptFiles.length} prompt files`);

      // Process each prompt file
      for (const file of promptFiles) {
        try {
          const shouldUpload = await this.shouldUploadFile(file);
          
          if (shouldUpload) {
            if (!this.config.dryRun) {
              await this.uploadFile(file);
            }
            result.uploaded.push(file.name);
            result.summary.uploaded++;
            console.log(`✅ ${file.name} (v${file.version})`);
          } else {
            result.skipped.push(file.name);
            result.summary.skipped++;
            console.log(`⏭️  ${file.name} (already up to date)`);
          }
        } catch (error) {
          result.errors.push({ file: file.name, error: error.message });
          result.summary.errors++;
          console.error(`❌ ${file.name}: ${error.message}`);
        }
      }

      // Update agent registry if requested
      if (this.config.updateRegistry && !this.config.dryRun) {
        await this.updateAgentRegistry(promptFiles);
      }

      // Print summary
      this.printSummary(result);

      return result;
    } catch (error) {
      console.error('💥 Sync failed:', error.message);
      throw error;
    }
  }

  private async loadPromptFiles(): Promise<PromptFile[]> {
    const files: PromptFile[] = [];
    const promptsDir = join(__dirname, '..', this.config.promptsDir);

    try {
      const entries = readdirSync(promptsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml'))) {
          const filePath = join(promptsDir, entry.name);
          const content = readFileSync(filePath, 'utf8');
          
          // Extract version and agent from filename
          const { version, agent } = this.parseFileName(entry.name);
          
          files.push({
            name: entry.name,
            path: filePath,
            content,
            version,
            agent
          });
        }
      }
    } catch (error) {
      throw new Error(`Failed to read prompts directory: ${error.message}`);
    }

    return files;
  }

  private parseFileName(filename: string): { version: string; agent: string } {
    // Parse filename like "instructor_v2_2.yml" -> agent: "instructor", version: "2.2"
    const match = filename.match(/^(.+)_v(\d+)_(\d+)\.ya?ml$/);
    
    if (match) {
      const [, agent, major, minor] = match;
      return { agent, version: `${major}.${minor}` };
    }
    
    // Fallback for other naming patterns
    const baseName = basename(filename, extname(filename));
    return { agent: baseName, version: '1.0' };
  }

  private async shouldUploadFile(file: PromptFile): Promise<boolean> {
    if (!this.config.validateVersions) {
      return true;
    }

    try {
      // Check if file exists in storage
      const { data, error } = await this.supabase.storage
        .from(this.config.storageBucket)
        .download(file.name);

      if (error && error.statusCode !== 404) {
        throw error;
      }

      if (!data) {
        return true; // File doesn't exist, should upload
      }

      // Compare versions (simplified - in real implementation, parse YAML)
      const remoteContent = await data.text();
      return remoteContent !== file.content;
    } catch (error) {
      console.warn(`⚠️  Could not check version for ${file.name}: ${error.message}`);
      return true; // Upload if we can't check
    }
  }

  private async uploadFile(file: PromptFile): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.config.storageBucket)
      .upload(file.name, file.content, {
        contentType: 'text/plain',
        upsert: true
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  private async updateAgentRegistry(promptFiles: PromptFile[]): Promise<void> {
    console.log('📝 Updating agent registry...');
    
    // This would update the agent registry with new prompt versions
    // For now, just log what would be updated
    const updates = promptFiles.map(file => ({
      agent: file.agent,
      version: file.version,
      promptPath: file.name
    }));

    console.log('Registry updates:', updates);
  }

  private printSummary(result: SyncResult): void {
    console.log('\n📊 Sync Summary:');
    console.log(`   Total files: ${result.summary.total}`);
    console.log(`   Uploaded: ${result.summary.uploaded}`);
    console.log(`   Skipped: ${result.summary.skipped}`);
    console.log(`   Errors: ${result.summary.errors}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
      });
    }
  }

  // Utility methods
  async validatePrompts(): Promise<boolean> {
    console.log('🔍 Validating prompts...');
    
    const promptFiles = await this.loadPromptFiles();
    let allValid = true;

    for (const file of promptFiles) {
      try {
        // Basic YAML validation
        if (!file.content.trim()) {
          throw new Error('Empty file');
        }

        // Check for required fields (simplified)
        if (!file.content.includes('version:') && !file.content.includes('action:')) {
          throw new Error('Missing required fields');
        }

        console.log(`✅ ${file.name} is valid`);
      } catch (error) {
        console.error(`❌ ${file.name}: ${error.message}`);
        allValid = false;
      }
    }

    return allValid;
  }

  async listRemotePrompts(): Promise<string[]> {
    const { data, error } = await this.supabase.storage
      .from(this.config.storageBucket)
      .list();

    if (error) {
      throw new Error(`Failed to list remote prompts: ${error.message}`);
    }

    return data.map((file: any) => file.name);
  }

  async downloadPrompt(filename: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.config.storageBucket)
      .download(filename);

    if (error) {
      throw new Error(`Failed to download ${filename}: ${error.message}`);
    }

    return await data.text();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: PromptSyncConfig = {
    supabaseUrl: process.env.SUPABASE_URL || 'https://jclgmvbkrlkppecwnljv.supabase.co',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    promptsDir: 'prompts/base',
    storageBucket: 'prompts',
    dryRun: args.includes('--dry-run'),
    validateVersions: !args.includes('--force'),
    updateRegistry: args.includes('--update-registry')
  };

  // Validate configuration
  if (!config.supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  const manager = new PromptSyncManager(config);

  try {
    if (args.includes('--validate')) {
      const isValid = await manager.validatePrompts();
      process.exit(isValid ? 0 : 1);
    } else if (args.includes('--list')) {
      const prompts = await manager.listRemotePrompts();
      console.log('Remote prompts:');
      prompts.forEach(prompt => console.log(`  ${prompt}`));
    } else if (args.includes('--download')) {
      const filename = args[args.indexOf('--download') + 1];
      if (!filename) {
        console.error('❌ Please specify filename for download');
        process.exit(1);
      }
      const content = await manager.downloadPrompt(filename);
      console.log(content);
    } else {
      // Default: sync prompts
      await manager.sync();
    }
  } catch (error) {
    console.error('💥 Operation failed:', error.message);
    process.exit(1);
  }
}

// Help text
function showHelp() {
  console.log(`
📚 Prompt Sync Tool

Usage: npm run prompt:sync [options]

Options:
  --dry-run              Show what would be uploaded without actually uploading
  --force                Upload all files regardless of version
  --update-registry      Update agent registry after sync
  --validate             Validate all prompt files
  --list                 List remote prompts
  --download <filename>  Download a specific prompt file
  --help                 Show this help message

Examples:
  npm run prompt:sync                    # Sync all prompts
  npm run prompt:sync --dry-run         # Preview sync
  npm run prompt:sync --validate        # Validate prompts
  npm run prompt:sync --list            # List remote prompts
  npm run prompt:sync --download instructor_v2_2.yml
`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--help')) {
    showHelp();
  } else {
    main().catch(console.error);
  }
}
