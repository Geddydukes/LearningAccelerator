#!/bin/bash

# ⚠️  DEPRECATED: Use `npm run prompt:sync` instead
# @deprecated Use the unified prompt-sync.ts script instead

# Sync prompts to Supabase storage
# Usage: bash scripts/sync-prompts.sh

set -e

# Check required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN environment variable is required"
    exit 1
fi

if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "❌ SUPABASE_PROJECT_ID environment variable is required"
    exit 1
fi

echo "🚀 Starting prompt sync to Supabase..."

# Build the manifest first
echo "📦 Building agents manifest..."
npm run build:manifest

# Check if manifest was created
if [ ! -f "build/agents.manifest.json" ]; then
    echo "❌ Manifest not found. Run 'npm run build:manifest' first."
    exit 1
fi

# Function to upload file with cache headers
upload_file() {
    local bucket=$1
    local local_path=$2
    local remote_path=$3
    local cache_control=$4
    
    echo "📤 Uploading to $bucket/$remote_path..."
    
    # Create signed URL for upload
    local upload_url=$(curl -s -X POST \
        -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_ID/storage/buckets/$bucket/objects/sign/$remote_path" \
        -d '{"method": "PUT"}' | jq -r '.signedURL')
    
    if [ "$upload_url" = "null" ] || [ -z "$upload_url" ]; then
        echo "❌ Failed to get signed URL for $bucket/$remote_path"
        return 1
    fi
    
    # Upload file with cache headers
    local response=$(curl -s -w "%{http_code}" \
        -X PUT \
        -H "Cache-Control: $cache_control" \
        --upload-file "$local_path" \
        "$upload_url")
    
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
        echo "✅ Uploaded $bucket/$remote_path"
    else
        echo "❌ Failed to upload $bucket/$remote_path (HTTP $status_code): $body"
        return 1
    fi
}

# Upload manifest (short TTL)
echo "📋 Uploading agents manifest..."
upload_file "prompts-manifest" "build/agents.manifest.json" "agents.manifest.json" "public,max-age=60"

# Upload base prompts (long TTL, immutable)
echo "📚 Uploading base prompts..."
for prompt_file in prompts/base/*; do
    if [ -f "$prompt_file" ]; then
        filename=$(basename "$prompt_file")
        echo "📄 Processing $filename..."
        upload_file "prompts-base" "$prompt_file" "$filename" "public,max-age=31536000,immutable"
    fi
done

echo "🎉 Prompt sync completed successfully!"
echo "📊 Manifest: prompts-manifest/agents.manifest.json"
echo "📚 Base prompts: prompts-base/*"
echo "🔧 Ready for compilation via track-sync endpoint"
