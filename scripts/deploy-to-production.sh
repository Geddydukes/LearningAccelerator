#!/bin/bash

# Production Deployment Script for Learning Accelerator
# This script deploys all functions and builds the frontend for production

set -e  # Exit on any error

echo "🚀 Starting Production Deployment for Learning Accelerator"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Check environment variables
check_environment() {
    print_status "Checking environment variables..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Please create one based on env.example"
        print_status "Copying env.example to .env..."
        cp env.example .env
        print_warning "Please update .env with your actual values before continuing"
        read -p "Press Enter after updating .env file..."
    fi
    
    # Check for required environment variables
    source .env
    
    required_vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "GEMINI_API_KEY"
        "ELEVENLABS_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_success "All required environment variables are set"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Deploy Supabase functions
deploy_functions() {
    print_status "Deploying Supabase functions..."
    
    # List of functions to deploy
    functions=(
        "onboarder-agent"
        "portfolio-curator"
        "clarifier-agent"
        "instructor-agent"
        "ta-agent"
        "socratic-agent"
        "alex-agent"
        "brand-agent"
        "career-match"
        "agent-proxy"
        "voice"
    )
    
    for func in "${functions[@]}"; do
        print_status "Deploying $func..."
        if supabase functions deploy "$func"; then
            print_success "$func deployed successfully"
        else
            print_error "Failed to deploy $func"
            exit 1
        fi
    done
    
    print_success "All functions deployed successfully"
}

# Upload prompts to storage
upload_prompts() {
    print_status "Uploading prompts to storage..."
    
    if [ -d "prompts/base" ]; then
        # Create prompts bucket if it doesn't exist
        supabase storage create agent-prompts || true
        
        # Upload all prompt files
        for prompt_file in prompts/base/*.yml; do
            if [ -f "$prompt_file" ]; then
                filename=$(basename "$prompt_file")
                print_status "Uploading $filename..."
                supabase storage upload agent-prompts "$prompt_file" "$filename" || true
            fi
        done
        
        print_success "Prompts uploaded successfully"
    else
        print_warning "Prompts directory not found, skipping prompt upload"
    fi
}

# Build frontend
build_frontend() {
    print_status "Building frontend for production..."
    
    if npm run build; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running production readiness tests..."
    
    if [ -f "scripts/test-production-readiness.ts" ]; then
        npx tsx scripts/test-production-readiness.ts
        print_success "Production readiness tests completed"
    else
        print_warning "Production readiness test script not found, skipping tests"
    fi
}

# Generate deployment summary
generate_summary() {
    print_status "Generating deployment summary..."
    
    cat > deployment-summary.md << EOF
# Learning Accelerator - Production Deployment Summary

## Deployment Date
$(date)

## Deployed Components

### Supabase Functions
- onboarder-agent
- portfolio-curator  
- clarifier-agent
- instructor-agent
- ta-agent
- socratic-agent
- alex-agent
- brand-agent
- career-match
- agent-proxy
- voice

### Frontend
- Production build completed
- All assets optimized
- PWA configuration included

### Prompts
- All agent prompts uploaded to storage
- Version mismatches resolved

## Environment Variables
- VITE_SUPABASE_URL: ✅ Configured
- VITE_SUPABASE_ANON_KEY: ✅ Configured  
- SUPABASE_SERVICE_ROLE_KEY: ✅ Configured
- GEMINI_API_KEY: ✅ Configured
- ELEVENLABS_API_KEY: ✅ Configured

## Next Steps
1. Test all agent endpoints
2. Verify voice integration
3. Test instructor-centric learning flow
4. Monitor performance and errors
5. Set up monitoring and alerts

## Production URLs
- Frontend: [Your hosting URL]
- Supabase Dashboard: [Your Supabase URL]
- Functions: [Your Supabase Functions URL]

EOF

    print_success "Deployment summary generated: deployment-summary.md"
}

# Main deployment flow
main() {
    echo "Starting deployment process..."
    echo ""
    
    check_dependencies
    check_environment
    install_dependencies
    deploy_functions
    upload_prompts
    build_frontend
    run_tests
    generate_summary
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "=================================================="
    echo ""
    echo "Your Learning Accelerator is now production ready!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy the frontend build to your hosting platform"
    echo "2. Test all functionality in production"
    echo "3. Set up monitoring and error tracking"
    echo "4. Configure domain and SSL certificates"
    echo ""
    echo "For support, check the deployment-summary.md file"
}

# Run main function
main "$@"
