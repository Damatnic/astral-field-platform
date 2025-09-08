#!/bin/bash

# Production Deployment Script with Comprehensive Monitoring
# Integrates all CI/CD pipeline components for bulletproof deployments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/deployment.log"
MONITORING_LOG="${PROJECT_ROOT}/monitoring.log"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Logging functions
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    log "${BLUE}[INFO]${NC} $1"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    log_info "Cleaning up deployment processes..."
    
    # Stop background monitoring if running
    if [[ -n "${MONITOR_PID:-}" ]]; then
        kill "$MONITOR_PID" 2>/dev/null || true
    fi
    
    # Generate final report
    generate_deployment_report "$exit_code"
    
    exit $exit_code
}

# Set up cleanup trap
trap cleanup EXIT

# Help function
show_help() {
    cat << EOF
Production Deployment Script with Monitoring

USAGE:
    $0 [OPTIONS] ENVIRONMENT

ENVIRONMENTS:
    staging     Deploy to staging environment
    production  Deploy to production environment

OPTIONS:
    -h, --help              Show this help message
    -f, --force             Skip tests and force deployment
    -m, --monitor-only      Only run monitoring, skip deployment
    -s, --security-scan     Run security scan before deployment
    -d, --dry-run           Show what would be deployed without doing it
    -t, --timeout SECONDS   Deployment timeout (default: 600)
    --skip-tests            Skip running tests
    --skip-build            Skip building the application
    --enable-rollback       Enable automatic rollback on failure

EXAMPLES:
    $0 staging                          # Deploy to staging
    $0 production --security-scan       # Deploy to production with security scan
    $0 staging --monitor-only           # Monitor staging without deploying
    $0 production --force               # Force deploy to production

ENVIRONMENT VARIABLES:
    VERCEL_TOKEN            Vercel API token
    SENTRY_AUTH_TOKEN       Sentry authentication token  
    SLACK_WEBHOOK_URL       Slack webhook for notifications
    GITHUB_TOKEN            GitHub token for API access

EOF
}

# Parse command line arguments
ENVIRONMENT=""
FORCE_DEPLOY=false
MONITOR_ONLY=false
SECURITY_SCAN=false
DRY_RUN=false
DEPLOYMENT_TIMEOUT=600
SKIP_TESTS=false
SKIP_BUILD=false
ENABLE_ROLLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        -m|--monitor-only)
            MONITOR_ONLY=true
            shift
            ;;
        -s|--security-scan)
            SECURITY_SCAN=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -t|--timeout)
            DEPLOYMENT_TIMEOUT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --enable-rollback)
            ENABLE_ROLLBACK=true
            shift
            ;;
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" && "$MONITOR_ONLY" == false ]]; then
    log_error "Environment is required (staging or production)"
    show_help
    exit 1
fi

# Validate required environment variables
validate_environment() {
    local missing_vars=()
    
    if [[ -z "${VERCEL_TOKEN:-}" ]]; then
        missing_vars+=("VERCEL_TOKEN")
    fi
    
    if [[ "$SECURITY_SCAN" == true && -z "${SNYK_TOKEN:-}" ]]; then
        missing_vars+=("SNYK_TOKEN")
    fi
    
    if [[ "${#missing_vars[@]}" -gt 0 ]]; then
        log_error "Missing required environment variables:"
        printf '%s\\n' "${missing_vars[@]}"
        exit 1
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check Node.js version
    local node_version
    node_version=$(node --version | sed 's/v//')
    log_info "Node.js version: $node_version"
    
    # Check npm version
    local npm_version
    npm_version=$(npm --version)
    log_info "npm version: $npm_version"
    
    # Check Git status
    if [[ $(git status --porcelain | wc -l) -ne 0 ]]; then
        log_warning "Working directory has uncommitted changes"
        git status --short
    fi
    
    # Check dependencies
    log_info "Checking dependencies..."
    npm audit --audit-level=high || log_warning "npm audit found vulnerabilities"
    
    log_success "Pre-deployment checks completed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true || "$FORCE_DEPLOY" == true ]]; then
        log_warning "Skipping tests"
        return 0
    fi
    
    log_info "Running test suite..."
    
    # Type checking
    log_info "Running TypeScript type check..."
    npm run type-check
    
    # Linting
    log_info "Running ESLint..."
    npm run lint
    
    # Unit tests
    log_info "Running unit tests..."
    npm run test:coverage
    
    # Integration tests
    log_info "Running integration tests..."
    npm run test:integration || log_warning "Integration tests failed"
    
    log_success "All tests completed"
}

# Security scanning
run_security_scan() {
    if [[ "$SECURITY_SCAN" != true ]]; then
        return 0
    fi
    
    log_info "Running security scans..."
    
    # Dependency vulnerability scan
    if command -v snyk &> /dev/null; then
        log_info "Running Snyk vulnerability scan..."
        snyk test --severity-threshold=high || log_warning "Snyk found vulnerabilities"
    fi
    
    # Secret scanning
    if command -v trufflehog &> /dev/null; then
        log_info "Running TruffleHog secret scan..."
        trufflehog --regex --entropy=False . || log_warning "TruffleHog found potential secrets"
    fi
    
    log_success "Security scans completed"
}

# Build application
build_application() {
    if [[ "$SKIP_BUILD" == true ]]; then
        log_warning "Skipping build"
        return 0
    fi
    
    log_info "Building application..."
    
    # Clean previous build
    rm -rf .next
    
    # Build for production
    NODE_ENV=production npm run build:production
    
    log_success "Application build completed"
}

# Deploy to Vercel
deploy_to_vercel() {
    local env="$1"
    log_info "Deploying to $env environment..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would deploy to $env"
        return 0
    fi
    
    # Install Vercel CLI if not present
    if ! command -v vercel &> /dev/null; then
        log_info "Installing Vercel CLI..."
        npm install -g vercel@latest
    fi
    
    # Pull environment configuration
    if [[ "$env" == "production" ]]; then
        vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
        vercel build --prod --token="$VERCEL_TOKEN"
    else
        vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
        vercel build --token="$VERCEL_TOKEN"
    fi
    
    # Deploy
    local deployment_url
    if [[ "$env" == "production" ]]; then
        deployment_url=$(vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN")
    else
        deployment_url=$(vercel deploy --prebuilt --token="$VERCEL_TOKEN")
    fi
    
    echo "$deployment_url" > "${PROJECT_ROOT}/.vercel-url"
    log_success "Deployed to: $deployment_url"
    
    # Record deployment in rollback manager
    if [[ "$ENABLE_ROLLBACK" == true ]]; then
        record_deployment "$deployment_url" "$env"
    fi
    
    return 0
}

# Record deployment for rollback tracking
record_deployment() {
    local url="$1"
    local env="$2"
    local version
    version=$(git rev-parse --short HEAD)
    
    log_info "Recording deployment for rollback tracking..."
    
    # Call rollback API to record deployment
    curl -X POST "localhost:3000/api/deployment/rollback" \\
        -H "Content-Type: application/json" \\
        -d "{
            \"action\": \"record\",
            \"id\": \"deploy_$(date +%s)\",
            \"url\": \"$url\",
            \"version\": \"$version\",
            \"environment\": \"$env\"
        }" || log_warning "Failed to record deployment for rollback tracking"
}

# Post-deployment verification
post_deployment_verification() {
    local deployment_url
    
    if [[ -f "${PROJECT_ROOT}/.vercel-url" ]]; then
        deployment_url=$(cat "${PROJECT_ROOT}/.vercel-url")
    else
        log_error "Deployment URL not found"
        return 1
    fi
    
    log_info "Running post-deployment verification..."
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    sleep 30
    
    # Health check
    local health_check_url="${deployment_url}/api/health"
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s "$health_check_url" > /dev/null; then
            log_success "Health check passed"
            break
        elif [[ $attempt -eq $max_attempts ]]; then
            log_error "Health check failed after $max_attempts attempts"
            return 1
        else
            log_info "Health check failed, retrying in 10 seconds..."
            sleep 10
        fi
        
        ((attempt++))
    done
    
    # System health check
    log_info "Running system health check..."
    local system_health_url="${deployment_url}/api/health/system"
    local health_response
    health_response=$(curl -s "$system_health_url")
    
    if echo "$health_response" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
        log_success "System health check passed"
    else
        log_warning "System health check shows degraded status"
        echo "$health_response" | jq '.status, .services' || true
    fi
    
    # Performance check
    log_info "Running performance check..."
    local start_time end_time response_time
    start_time=$(date +%s%N)
    curl -s "$deployment_url" > /dev/null
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))
    
    log_info "Response time: ${response_time}ms"
    
    if [[ $response_time -gt 5000 ]]; then
        log_warning "High response time detected: ${response_time}ms"
    else
        log_success "Performance check passed"
    fi
    
    log_success "Post-deployment verification completed"
}

# Start monitoring
start_monitoring() {
    log_info "Starting infrastructure monitoring..."
    
    # Start monitoring script in background
    node "${SCRIPT_DIR}/infrastructure/monitor.js" monitor &
    MONITOR_PID=$!
    
    log_info "Monitoring started (PID: $MONITOR_PID)"
    echo "$MONITOR_PID" > "${PROJECT_ROOT}/.monitor-pid"
}

# Send notifications
send_notifications() {
    local status="$1"
    local env="$2"
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local emoji color message
        
        if [[ "$status" == "success" ]]; then
            emoji="✅"
            color="good"
            message="Deployment successful!"
        else
            emoji="❌"
            color="danger"
            message="Deployment failed!"
        fi
        
        local payload
        payload=$(cat << EOF
{
    "text": "$emoji $message",
    "attachments": [
        {
            "color": "$color",
            "fields": [
                {
                    "title": "Environment",
                    "value": "$env",
                    "short": true
                },
                {
                    "title": "Commit",
                    "value": "$(git rev-parse --short HEAD)",
                    "short": true
                },
                {
                    "title": "Author",
                    "value": "$(git log -1 --pretty=format:'%an')",
                    "short": true
                }
            ],
            "ts": $(date +%s)
        }
    ]
}
EOF
        )
        
        curl -X POST "$SLACK_WEBHOOK_URL" \\
            -H 'Content-Type: application/json' \\
            -d "$payload" || log_warning "Failed to send Slack notification"
    fi
}

# Generate deployment report
generate_deployment_report() {
    local exit_code="$1"
    local report_file="${PROJECT_ROOT}/deployment-report.json"
    
    log_info "Generating deployment report..."
    
    local status
    if [[ $exit_code -eq 0 ]]; then
        status="success"
    else
        status="failed"
    fi
    
    local deployment_url=""
    if [[ -f "${PROJECT_ROOT}/.vercel-url" ]]; then
        deployment_url=$(cat "${PROJECT_ROOT}/.vercel-url")
    fi
    
    cat << EOF > "$report_file"
{
    "deployment": {
        "status": "$status",
        "environment": "$ENVIRONMENT",
        "url": "$deployment_url",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "commit": "$(git rev-parse HEAD)",
        "branch": "$(git branch --show-current)",
        "author": "$(git log -1 --pretty=format:'%an <%ae>')"
    },
    "configuration": {
        "force_deploy": $FORCE_DEPLOY,
        "security_scan": $SECURITY_SCAN,
        "skip_tests": $SKIP_TESTS,
        "skip_build": $SKIP_BUILD,
        "enable_rollback": $ENABLE_ROLLBACK,
        "timeout": $DEPLOYMENT_TIMEOUT
    },
    "logs": {
        "deployment_log": "$LOG_FILE",
        "monitoring_log": "$MONITORING_LOG"
    }
}
EOF
    
    log_success "Deployment report saved to: $report_file"
}

# Main deployment function
main() {
    log_info "=== Starting Deployment Process ==="
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $(date)"
    log_info "Commit: $(git rev-parse --short HEAD)"
    log_info "Branch: $(git branch --show-current)"
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    if [[ "$MONITOR_ONLY" == true ]]; then
        log_info "Monitor-only mode enabled"
        start_monitoring
        
        # Wait for interrupt
        log_info "Monitoring... Press Ctrl+C to stop"
        wait
        return 0
    fi
    
    # Validate environment
    validate_environment
    
    # Pre-deployment checks
    pre_deployment_checks
    
    # Security scanning
    run_security_scan
    
    # Run tests
    run_tests
    
    # Build application
    build_application
    
    # Deploy
    deploy_to_vercel "$ENVIRONMENT"
    
    # Post-deployment verification
    post_deployment_verification
    
    # Start monitoring
    start_monitoring
    
    # Send success notification
    send_notifications "success" "$ENVIRONMENT"
    
    log_success "=== Deployment Completed Successfully ==="
    
    # Show deployment info
    if [[ -f "${PROJECT_ROOT}/.vercel-url" ]]; then
        local deployment_url
        deployment_url=$(cat "${PROJECT_ROOT}/.vercel-url")
        log_info "Deployment URL: $deployment_url"
    fi
}

# Error handling
handle_error() {
    local exit_code=$?
    log_error "Deployment failed with exit code: $exit_code"
    
    # Send failure notification
    if [[ -n "$ENVIRONMENT" ]]; then
        send_notifications "failed" "$ENVIRONMENT"
    fi
    
    # If rollback is enabled and this is a production deployment
    if [[ "$ENABLE_ROLLBACK" == true && "$ENVIRONMENT" == "production" ]]; then
        log_info "Attempting automatic rollback..."
        
        curl -X POST "localhost:3000/api/deployment/rollback" \\
            -H "Content-Type: application/json" \\
            -d "{
                \"action\": \"trigger\",
                \"reason\": \"Deployment failed with exit code: $exit_code\"
            }" || log_error "Automatic rollback failed"
    fi
    
    exit $exit_code
}

# Set up error handling
trap 'handle_error' ERR

# Run main function
main "$@"