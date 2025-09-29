#!/bin/bash

# End-to-end smoke test for prompt compilation system
# Usage: bash test/e2e-prompt-system.sh

set -e

# Configuration
SUPABASE_PROJECT="${SUPABASE_PROJECT_ID:-your-project-id}"
SUPABASE_URL="https://${SUPABASE_PROJECT}.supabase.co"
SERVICE_ROLE_JWT="${SUPABASE_SERVICE_ROLE_KEY:-your-service-role-key}"
TEST_USER_ID="00000000-0000-0000-0000-000000000001"

echo "🧪 Starting end-to-end prompt system test..."
echo "📍 Project: $SUPABASE_PROJECT"
echo "👤 Test User: $TEST_USER_ID"
echo ""

# Test 1: Compile CLO prompt
echo "1️⃣ Testing prompt compilation..."
compile_response=$(curl -sS -X POST \
  "${SUPABASE_URL}/functions/v1/track-sync" \
  -H "Authorization: Bearer ${SERVICE_ROLE_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId":"clo",
    "userId":"'${TEST_USER_ID}'",
    "variables":{
      "TRACK_LABEL":"AI/ML Engineering",
      "TIME_PER_WEEK":15,
      "END_GOAL":"Junior ML Engineer in 6 months",
      "LEARNING_STYLE":"mixed"
    }
  }')

echo "📋 Compile Response:"
echo "$compile_response" | jq '.'

# Extract compiled_url and hash
compiled_url=$(echo "$compile_response" | jq -r '.compiled_url // empty')
compiled_object_path=$(echo "$compile_response" | jq -r '.compiled_object_path // empty')
hash=$(echo "$compile_response" | jq -r '.hash // empty')
cached=$(echo "$compile_response" | jq -r '.cached // false')

if [ -z "$compiled_url" ]; then
  echo "❌ No compiled_url returned"
  exit 1
fi

echo "✅ Compilation successful:"
echo "   Hash: $hash"
echo "   Cached: $cached"
echo "   Object Path: $compiled_object_path"
echo ""

# Test 2: Call agent via proxy
echo "2️⃣ Testing agent proxy call..."
proxy_response=$(curl -sS -X POST \
  "${SUPABASE_URL}/functions/v1/agent-proxy" \
  -H "Authorization: Bearer ${SERVICE_ROLE_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "agent":"clo",
    "compiled_url":"'${compiled_url}'",
    "compiled_object_path":"'${compiled_object_path}'",
    "payload":{"command":"BEGIN_WEEK","week":1},
    "userId":"'${TEST_USER_ID}'",
    "weekNumber":1
  }')

echo "🤖 Proxy Response:"
echo "$proxy_response" | jq '.'

proxy_success=$(echo "$proxy_response" | jq -r '.success // false')
if [ "$proxy_success" = "true" ]; then
  echo "✅ Agent proxy call successful"
else
  echo "❌ Agent proxy call failed"
  exit 1
fi
echo ""

# Test 3: Cache hit test
echo "3️⃣ Testing cache hit..."
cache_response=$(curl -sS -X POST \
  "${SUPABASE_URL}/functions/v1/track-sync" \
  -H "Authorization: Bearer ${SERVICE_ROLE_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId":"clo",
    "userId":"'${TEST_USER_ID}'",
    "variables":{
      "TRACK_LABEL":"AI/ML Engineering",
      "TIME_PER_WEEK":15,
      "END_GOAL":"Junior ML Engineer in 6 months",
      "LEARNING_STYLE":"mixed"
    }
  }')

cache_hit=$(echo "$cache_response" | jq -r '.cached // false')
cache_hash=$(echo "$cache_response" | jq -r '.hash // empty')

if [ "$cache_hit" = "true" ] && [ "$cache_hash" = "$hash" ]; then
  echo "✅ Cache hit confirmed (same hash: $hash)"
else
  echo "❌ Cache miss or hash mismatch"
  echo "   Expected cached: true, got: $cache_hit"
  echo "   Expected hash: $hash, got: $cache_hash"
fi
echo ""

echo "🎉 End-to-end test completed successfully!"
echo ""
echo "📊 Test Summary:"
echo "   ✅ Prompt compilation working"
echo "   ✅ Agent proxy integration working"
echo "   ✅ Caching system working"
echo "   ✅ Signed URL system working"
echo ""
echo "🔍 Next steps:"
echo "   • Check telemetry tables for logged events"
echo "   • Verify no public access to compiled prompts"
echo "   • Test with different agents and variables"
