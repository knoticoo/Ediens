#!/bin/bash

# Ediens Food Sharing App - Development Environment Startup Script
# This script automatically sets up and starts the complete development environment
# 
# Features:
# - Gracefully handles Docker permission issues
# - Checks and installs dependencies if needed
# - Starts services with correct port configuration
# - Provides fallback modes when Docker isn't available
# - Better error handling for containerized environments

echo "🍽️  Ediens Food Sharing App - Development Startup"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Detect environment
detect_environment() {
    if [ -n "$SSH_CLIENT" ] || [ -n "$SSH_TTY" ]; then
        EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
        print_info "Detected VPS environment with external IP: $EXTERNAL_IP"
        return 0
    else
        EXTERNAL_IP="localhost"
        print_info "Detected local environment"
        return 1
    fi
}

# Check if dependencies are installed
check_dependencies() {
    echo ""
    echo "📦 Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_warning "Root dependencies not installed"
        return 1
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        print_warning "Backend dependencies not installed"
        return 1
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        print_warning "Frontend dependencies not installed"
        return 1
    fi
    
    print_status "All dependencies are installed"
    return 0
}

# Install dependencies if needed
install_dependencies_if_needed() {
    if ! check_dependencies; then
        echo ""
        print_info "Installing dependencies..."
        npm run install:all
        if [ $? -eq 0 ]; then
            print_status "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            exit 1
        fi
    fi
    
    # Ensure sqlite3 is installed for backend
    echo ""
    print_info "Ensuring sqlite3 is installed for backend..."
    cd backend
    if npm list sqlite3 > /dev/null 2>&1; then
        print_status "sqlite3 already installed"
    else
        print_warning "sqlite3 not found, installing..."
        npm install sqlite3
        if [ $? -eq 0 ]; then
            print_status "sqlite3 installed successfully"
        else
            print_error "Failed to install sqlite3"
            exit 1
        fi
    fi
    cd ..
}

# Check Docker status and handle gracefully
check_docker_status() {
    echo ""
    echo "🐳 Checking Docker status..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not installed - will run in database-less mode"
        return 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_warning "Docker daemon not running - will run in database-less mode"
        return 1
    fi
    
    # Check if user has Docker permissions
    if ! docker ps &> /dev/null; then
        print_warning "Docker permission denied - will run in database-less mode"
        return 1
    fi
    
    print_status "Docker is available and running"
    return 0
}

# Start Docker services if available
start_docker_services() {
    if check_docker_status; then
        echo ""
        print_info "Starting Docker services..."
        
        # Start PostgreSQL and Redis
        if docker compose up -d postgres redis 2>/dev/null; then
            print_status "Docker services started successfully"
            
            # Wait for services to be ready
            echo "⏳ Waiting for database services to be ready..."
            sleep 10
            
            # Run database migration
            echo "🔄 Running database migration..."
            cd backend
            npm run db:migrate
            cd ..
            
            return 0
        else
            print_warning "Failed to start Docker services - will run in database-less mode"
            return 1
        fi
    else
        print_warning "Docker not available - will run in database-less mode"
        return 1
    fi
}

# Stop any existing Node.js processes
stop_existing_processes() {
    echo ""
    echo "🛑 Stopping any existing Node.js processes..."
    
    # Stop backend on port 3001 (correct port)
    if lsof -ti:3001 > /dev/null 2>&1; then
        print_warning "Port 3001 (backend) is already in use"
        echo "   Stopping existing process..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null
    fi
    
    # Stop frontend on port 5173
    if lsof -ti:5173 > /dev/null 2>&1; then
        print_warning "Port 5173 (frontend) is already in use"
        echo "   Stopping existing process..."
        lsof -ti:5173 | xargs kill -9 2>/dev/null
    fi
    
    # Wait for processes to fully stop
    sleep 2
}

# Start backend server
start_backend() {
    echo ""
    echo "🔧 Starting backend server..."
    cd backend
    
    # Set environment variables for database-less mode if needed
    if [ "$DOCKER_AVAILABLE" = false ]; then
        export DATABASE_URL=""
        export REDIS_URL=""
        print_warning "Backend starting with SQLite database"
        
        # Initialize SQLite database if needed
        echo "🔄 Initializing SQLite database..."
        npm run db:init
        if [ $? -eq 0 ]; then
            print_status "SQLite database initialized successfully"
        else
            print_warning "Database initialization failed, continuing anyway..."
        fi
    fi
    
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 3
    
    # Check if backend is running
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Backend started successfully on port 3001"
    else
        print_warning "Backend may still be starting up..."
    fi
}

# Start frontend development server
start_frontend() {
    echo ""
    echo "🎨 Starting frontend development server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    sleep 3
    
    # Check if frontend is running
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_status "Frontend started successfully on port 5173"
    else
        print_warning "Frontend may still be starting up..."
    fi
}

# Show service status
show_status() {
    echo ""
    echo "📊 Service Status:"
    echo "=================="
    
    # Check Docker services
    if [ "$DOCKER_AVAILABLE" = true ]; then
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "ediens-postgres-1"; then
            print_status "PostgreSQL: Running"
        else
            print_error "PostgreSQL: Not running"
        fi
        
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "ediens-redis-1"; then
            print_status "Redis: Running"
        else
            print_error "Redis: Not running"
        fi
    else
        print_warning "PostgreSQL: Not available (Docker mode)"
        print_warning "Redis: Not available (Docker mode)"
    fi
    
    # Check Node.js processes
    if lsof -ti:3001 > /dev/null 2>&1; then
        print_status "Backend (Port 3001): Running"
    else
        print_error "Backend (Port 3001): Not running"
    fi
    
    if lsof -ti:5173 > /dev/null 2>&1; then
        print_status "Frontend (Port 5173): Running"
    else
        print_error "Frontend (Port 5173): Not running"
    fi
    
    echo ""
    echo "🌐 Access URLs:"
    echo "   - Frontend: http://${EXTERNAL_IP}:5173"
    echo "   - Backend:  http://${EXTERNAL_IP}:3001"
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "   - pgAdmin:  http://${EXTERNAL_IP}:5050 (admin@ediens.lv / admin123)"
    fi
    echo ""
}

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down development environment..."
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    # Stop Docker services if they were started
    if [ "$DOCKER_AVAILABLE" = true ]; then
        if command -v docker compose &> /dev/null; then
            docker compose down
        else
            docker-compose down
        fi
    fi
    
    print_status "Development environment stopped"
    exit 0
}

# Main execution
main() {
    # Detect environment
    detect_environment
    
    # Install dependencies if needed
    install_dependencies_if_needed
    
    # Check Docker status
    if start_docker_services; then
        DOCKER_AVAILABLE=true
    else
        DOCKER_AVAILABLE=false
    fi
    
    # Stop existing processes
    stop_existing_processes
    
    # Start services
    start_backend
    start_frontend
    
    # Show status
    show_status
    
    echo "🎉 Development environment started successfully!"
    echo ""
    if [ "$DOCKER_AVAILABLE" = false ]; then
        print_warning "Running with SQLite database - some advanced features may not work"
        print_warning "To enable full functionality with PostgreSQL, ensure Docker is running with proper permissions"
    fi
    echo ""
    echo "🛑 To stop all services:"
    echo "   - Press Ctrl+C in this terminal"
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "   - Or run: docker compose down"
    fi
    echo ""
    echo "📚 For more information, see README.md"
    
    # Set trap to cleanup on exit
    trap cleanup SIGINT SIGTERM
    
    # Wait for user to stop
    echo "⏳ Press Ctrl+C to stop all services..."
    wait
}

# Run main function
main