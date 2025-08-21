#!/bin/bash

# Ediens Food Sharing App - Development Environment Startup Script
# This script automatically sets up and starts the complete development environment
# 
# Features:
# - Auto-installs Docker if not present
# - Auto-starts Docker daemon if not running
# - Auto-installs Docker Compose if needed
# - Creates docker-compose.yml if missing
# - Sets up PostgreSQL, Redis, and pgAdmin
# - Handles environment configuration
# - Manages database setup and migrations
# - Starts frontend and backend development servers

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

# Check if Docker is running
echo "🐳 Checking Docker status..."

# Function to install Docker
install_docker() {
    print_info "Docker not found. Installing Docker..."
    
    # Check if we have sudo privileges
    if ! sudo -n true 2>/dev/null; then
        print_error "Sudo privileges required to install Docker"
        echo "   Please run this script with sudo or install Docker manually:"
        echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "   sudo sh get-docker.sh"
        echo "   sudo usermod -aG docker $USER"
        echo "   Then log out and back in, or run: newgrp docker"
        exit 1
    fi
    
    # Update package list
    sudo apt-get update -qq > /dev/null
    
    # Install required packages
    sudo apt-get install -y -qq apt-transport-https ca-certificates curl gnupg lsb-release > /dev/null
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package list again
    sudo apt-get update -qq > /dev/null
    
    # Install Docker
    sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin > /dev/null
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_status "Docker installed successfully"
    print_warning "You may need to log out and back in for group changes to take effect"
    print_warning "Or run: newgrp docker"
}

# Function to start Docker daemon
start_docker_daemon() {
    print_info "Starting Docker daemon..."
    
    # Try different methods to start Docker
    local docker_started=false
    
    # Method 1: Try systemctl if available
    if command -v systemctl &> /dev/null && systemctl is-system-running &> /dev/null; then
        print_info "Trying systemctl to start Docker..."
        if sudo systemctl start docker 2>/dev/null; then
            sleep 3
            if docker info > /dev/null 2>&1; then
                docker_started=true
                print_status "Docker started via systemctl"
            fi
        fi
    fi
    
    # Method 2: Try direct daemon start
    if [ "$docker_started" = false ]; then
        print_info "Trying direct daemon start..."
        sudo dockerd --host=unix:///var/run/docker.sock &
        DOCKER_PID=$!
        
        # Wait for Docker to be ready
        local attempts=0
        local max_attempts=30
        
        while [ $attempts -lt $max_attempts ]; do
            if docker info > /dev/null 2>&1; then
                docker_started=true
                print_status "Docker daemon started successfully"
                break
            fi
            attempts=$((attempts + 1))
            sleep 2
        done
        
        if [ "$docker_started" = false ]; then
            # Kill the background process if it failed
            kill $DOCKER_PID 2>/dev/null || true
        fi
    fi
    
    # Method 3: Try using the get-docker script
    if [ "$docker_started" = false ]; then
        print_info "Trying alternative installation method..."
        if curl -fsSL https://get.docker.com -o get-docker.sh 2>/dev/null; then
            if sudo sh get-docker.sh --dry-run 2>/dev/null | grep -q "docker-ce"; then
                print_info "Docker appears to be properly installed"
                print_warning "Please start Docker manually:"
                echo "   sudo dockerd &"
                echo "   Or: sudo systemctl start docker"
                return 1
            fi
        fi
    fi
    
    if [ "$docker_started" = true ]; then
        return 0
    else
        print_error "Failed to start Docker daemon"
        return 1
    fi
}

# Check for required system packages
check_system_packages() {
    local missing_packages=()
    
    # Check for essential packages
    for package in curl wget apt-transport-https ca-certificates gnupg lsb-release; do
        if ! dpkg -l | grep -q "^ii.*$package"; then
            missing_packages+=("$package")
        fi
    done
    
    if [ ${#missing_packages[@]} -gt 0 ]; then
        print_info "Installing required system packages..."
        sudo apt-get update -qq > /dev/null
        sudo apt-get install -y -qq "${missing_packages[@]}" > /dev/null
        print_status "System packages installed"
    fi
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    check_system_packages
    install_docker
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_warning "Docker is not running. Attempting to start..."
    
    if start_docker_daemon; then
        print_status "Docker is now running"
    else
        print_error "Failed to start Docker. Please start it manually and try again."
        echo "   You can try: sudo dockerd &"
        exit 1
    fi
else
    print_status "Docker is running"
fi

# Check if services are already running
echo ""
echo "🔍 Checking if services are already running..."
SERVICES_RUNNING=false

if docker ps --format "table {{.Names}}" | grep -q "ediens-postgres-1\|ediens-redis-1"; then
    SERVICES_RUNNING=true
fi

if lsof -ti:3000 > /dev/null 2>&1 || lsof -ti:5173 > /dev/null 2>&1; then
    SERVICES_RUNNING=true
fi

if [ "$SERVICES_RUNNING" = true ]; then
    print_warning "Some services are already running"
    echo ""
    echo "Options:"
    echo "   1. Restart all services (recommended)"
    echo "   2. Exit and manage manually"
    echo ""
    read -p "Choose option (1 or 2): " choice
    
    case $choice in
        1)
            print_info "Restarting all services..."
            ;;
        2)
            print_info "Exiting. You can manage services manually."
            exit 0
            ;;
        *)
            print_info "Invalid choice. Restarting all services..."
            ;;
    esac
fi

# Generate secure random passwords if they don't exist
generate_secure_password() {
    # Generate a secure password with only alphanumeric characters
    openssl rand -hex 32 | tr -d '\n' | cut -c1-25
}

# Check and create .env file with secure defaults
echo ""
echo "🔐 Setting up environment configuration..."
if [ ! -f .env ]; then
    print_info "Creating .env file with secure defaults..."
    
    # Generate secure passwords
    DB_PASSWORD=$(generate_secure_password)
    JWT_SECRET=$(openssl rand -hex 64)
    
    # Create .env file with secure defaults
    cat > .env << EOF
# Ediens Food Sharing App - Auto-generated Environment Configuration
# Generated on: $(date)

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ediens_db
DB_USER=ediens_user
DB_PASSWORD=${DB_PASSWORD}

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# =============================================================================
# OAUTH CONFIGURATION (Update these for production)
# =============================================================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# =============================================================================
# FILE UPLOAD CONFIGURATION
# =============================================================================
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# =============================================================================
# MAPBOX CONFIGURATION (Update for production)
# =============================================================================
MAPBOX_ACCESS_TOKEN=your-mapbox-access-token

# =============================================================================
# EMAIL CONFIGURATION (Update for production)
# =============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# =============================================================================
# RATE LIMITING
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

    print_status "Created .env with secure passwords"
    echo "   Database password: ${DB_PASSWORD}"
    echo "   JWT secret: ${JWT_SECRET:0:20}..."
else
    print_info ".env file already exists, using existing configuration"
fi

# Update docker-compose.yml with generated passwords if needed
echo ""
echo "🐳 Configuring Docker services..."
if [ -f .env ]; then
    # Source the .env file to get variables
    export $(cat .env | grep -v '^#' | xargs)
    
    # Check if docker-compose.yml needs password update
    if grep -q "POSTGRES_PASSWORD=.*" docker-compose.yml; then
        # Update docker-compose.yml with the password from .env
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${DB_PASSWORD}/" docker-compose.yml
        print_status "Updated docker-compose.yml with database password"
    fi
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose not found. Installing..."
    sudo apt-get update -qq > /dev/null
    sudo apt-get install -y -qq docker-compose-plugin > /dev/null
    
    # Create symlink for docker-compose command
    if [ ! -f /usr/local/bin/docker-compose ]; then
        sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
    fi
    
    print_status "Docker Compose installed"
fi

# Check if docker-compose.yml exists
if [ ! -f docker-compose.yml ]; then
    print_warning "docker-compose.yml not found. Creating default configuration..."
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ediens-postgres-1
    environment:
      POSTGRES_DB: ediens_db
      POSTGRES_USER: ediens_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-ediens_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ediens_user -d ediens_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ediens-redis-1
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ediens-pgadmin-1
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ediens.lv
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    restart: unless-stopped
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
  pgadmin_data:
EOF

    print_status "Created docker-compose.yml with default configuration"
fi

# Start Docker services
echo ""
echo "🚀 Starting Docker services (PostgreSQL, Redis)..."
docker-compose up -d

if [ $? -ne 0 ]; then
    print_error "Failed to start Docker services"
    exit 1
fi
print_status "Docker services started successfully"

# Wait for database to be ready with better detection
echo ""
echo "⏳ Waiting for database to be ready..."
DB_READY=false
ATTEMPTS=0
MAX_ATTEMPTS=30

while [ "$DB_READY" = false ] && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if docker exec ediens-postgres-1 pg_isready -U ediens_user -d ediens_db > /dev/null 2>&1; then
        DB_READY=true
        print_status "Database is ready"
    else
        ATTEMPTS=$((ATTEMPTS + 1))
        echo "   Attempt $ATTEMPTS/$MAX_ATTEMPTS - Waiting for database..."
        sleep 2
    fi
done

if [ "$DB_READY" = false ]; then
    print_warning "Database might not be fully ready, continuing anyway..."
fi

# Check if database exists and create if needed
echo ""
echo "🗄️  Setting up database..."
if docker exec ediens-postgres-1 psql -U ediens_user -d postgres -c "SELECT 1 FROM pg_database WHERE datname='ediens_db'" 2>/dev/null | grep -q 1; then
    print_info "Database 'ediens_db' already exists"
else
    print_info "Creating database 'ediens_db'..."
    docker exec ediens-postgres-1 psql -U ediens_user -d postgres -c "CREATE DATABASE ediens_db;" 2>/dev/null
    print_status "Database created successfully"
fi

# Check and run database migrations
echo ""
echo "🔧 Checking for database migrations..."
cd backend

# Check if migrations table exists
if npm run db:migrate:status 2>/dev/null | grep -q "No migrations found"; then
    print_info "No migrations to run"
else
    print_info "Running database migrations..."
    npm run db:migrate 2>/dev/null || print_warning "Migration command not found or failed"
fi

# Check if database has data and seed if needed
echo ""
echo "🌱 Checking database seeding status..."
if npm run db:seed:status 2>/dev/null | grep -q "Database already seeded"; then
    print_info "Database already seeded"
else
    print_info "Seeding database with sample data..."
    npm run db:seed 2>/dev/null || print_warning "Seed command not found or failed"
fi

cd ..

# Stop any existing services and containers
echo ""
echo "🛑 Stopping any existing services..."
print_info "Stopping existing Node.js processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

print_info "Stopping existing Docker containers..."
docker-compose down 2>/dev/null || true

# Check if ports are already in use and kill processes
echo ""
echo "🔍 Checking port availability..."
if lsof -ti:3000 > /dev/null 2>&1; then
    print_warning "Port 3000 (backend) is already in use"
    echo "   Stopping existing process..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    print_warning "Port 5173 (frontend) is already in use"
    echo "   Stopping existing process..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
fi

# Wait a moment for processes to fully stop
sleep 2

# Start backend server
echo ""
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo ""
echo "🎨 Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
print_status "Development environment started successfully!"
echo ""
echo "🌐 Services running:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://localhost:3000"
echo "   - Database: localhost:5432 (user: ediens_user, password: ${DB_PASSWORD})"
echo "   - Redis:    localhost:6379"
echo ""
echo "📱 Test the notification system:"
echo "   - Visit: http://localhost:5173/demo/notifications"
echo "   - Click notification buttons to test"
echo ""
echo "🔐 Database credentials:"
echo "   - Database: ediens_db"
echo "   - Username: ediens_user"
echo "   - Password: ${DB_PASSWORD}"
echo ""
echo "🛑 To stop all services:"
echo "   - Press Ctrl+C in this terminal"
echo "   - Or run: docker-compose down"
echo ""
echo "📚 For more information, see README.md"

# Function to cleanup on exit
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
    
    # Stop Docker services
    docker-compose down
    
    print_status "Development environment stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
# Function to show service status
show_status() {
    echo ""
    echo "📊 Service Status:"
    echo "=================="
    
    # Check Docker services
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
    
    # Check Node.js processes
    if lsof -ti:3000 > /dev/null 2>&1; then
        print_status "Backend (Port 3000): Running"
    else
        print_error "Backend (Port 3000): Not running"
    fi
    
    if lsof -ti:5173 > /dev/null 2>&1; then
        print_status "Frontend (Port 5173): Running"
    else
        print_error "Frontend (Port 5173): Not running"
    fi
    
    echo ""
    echo "🌐 Access URLs:"
    echo "   - Frontend: http://localhost:5173"
    echo "   - Backend:  http://localhost:3000"
    echo "   - pgAdmin:  http://localhost:5050 (admin@ediens.lv / admin123)"
    echo ""
}

# Show initial status
show_status

echo "⏳ Press Ctrl+C to stop all services..."
echo "   Or run 'docker-compose down' to stop only database services"

# Wait for user to stop
wait