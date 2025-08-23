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

# Detect if running on VPS (check for external IP)
detect_environment() {
    if [ -n "$SSH_CLIENT" ] || [ -n "$SSH_TTY" ]; then
        # We're on a remote server, get the external IP
        EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
        print_info "Detected VPS environment with external IP: $EXTERNAL_IP"
        return 0
    else
        EXTERNAL_IP="localhost"
        print_info "Detected local environment"
        return 1
    fi
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
            fi
        fi
    fi
    
    # Method 2: Try service command
    if [ "$docker_started" = false ] && command -v service &> /dev/null; then
        print_info "Trying service command to start Docker..."
        if sudo service docker start 2>/dev/null; then
            sleep 3
            if docker info > /dev/null 2>&1; then
                docker_started=true
            fi
        fi
    fi
    
    # Method 3: Try dockerd directly
    if [ "$docker_started" = false ]; then
        print_info "Trying to start Docker daemon directly..."
        if sudo dockerd > /dev/null 2>&1 & then
            sleep 5
            if docker info > /dev/null 2>&1; then
                docker_started=true
            fi
        fi
    fi
    
    if [ "$docker_started" = true ]; then
        print_status "Docker daemon started successfully"
    else
        print_error "Failed to start Docker daemon"
        print_info "Try starting it manually: sudo dockerd &"
        exit 1
    fi
}

# Check Docker installation and status
if ! command -v docker &> /dev/null; then
    install_docker
fi

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    start_docker_daemon
fi

print_status "Docker is running"

# Detect environment (VPS vs local)
detect_environment

# Check if services are already running
echo ""
echo "🔍 Checking for existing services..."
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
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=ediens_db
DB_USER=ediens_user
DB_PASSWORD=${DB_PASSWORD}

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_HOST=127.0.0.1
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
CORS_ORIGIN=http://${EXTERNAL_IP}:5173

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
    
    # Update existing .env with correct IP addresses if needed
    if grep -q "DB_HOST=localhost" .env; then
        print_info "Updating DB_HOST from localhost to 127.0.0.1"
        sed -i 's/DB_HOST=localhost/DB_HOST=127.0.0.1/' .env
    fi
    
    if grep -q "REDIS_HOST=localhost" .env; then
        print_info "Updating REDIS_HOST from localhost to 127.0.0.1"
        sed -i 's/REDIS_HOST=localhost/REDIS_HOST=127.0.0.1/' .env
    fi
    
    # Update CORS_ORIGIN if it's still localhost
    if grep -q "CORS_ORIGIN=http://localhost:5173" .env; then
        print_info "Updating CORS_ORIGIN to use external IP"
        sed -i "s|CORS_ORIGIN=http://localhost:5173|CORS_ORIGIN=http://${EXTERNAL_IP}:5173|" .env
    fi
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
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
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

# Stop any existing services first
echo ""
echo "🛑 Stopping any existing services..."
if command -v docker compose &> /dev/null; then
    docker compose down 2>/dev/null
else
    docker-compose down 2>/dev/null
fi

# Start Docker services
echo ""
echo "🚀 Starting Docker services (PostgreSQL, Redis)..."
if command -v docker compose &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

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
    docker exec ediens-postgres-1 createdb -U ediens_user ediens_db
    if [ $? -eq 0 ]; then
        print_status "Database 'ediens_db' created successfully"
    else
        print_warning "Failed to create database, it might already exist"
    fi
fi

# Check if Redis is ready
echo ""
echo "⏳ Checking Redis status..."
if docker exec ediens-redis-1 redis-cli ping > /dev/null 2>&1; then
    print_status "Redis is ready"
else
    print_warning "Redis might not be fully ready, continuing anyway..."
fi

# Stop any existing Node.js processes
echo ""
echo "🛑 Stopping any existing Node.js processes..."
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
echo "   - Frontend: http://${EXTERNAL_IP}:5173"
echo "   - Backend:  http://${EXTERNAL_IP}:3000"
echo "   - Database: ${EXTERNAL_IP}:5432 (user: ediens_user, password: ${DB_PASSWORD})"
echo "   - Redis:    ${EXTERNAL_IP}:6379"
echo ""
echo "📱 Test the notification system:"
echo "   - Visit: http://${EXTERNAL_IP}:5173/demo/notifications"
echo "   - Click notification buttons to test"
echo ""
echo "🔐 Database credentials:"
echo "   - Database: ediens_db"
echo "   - Username: ediens_user"
echo "   - Password: ${DB_PASSWORD}"
echo ""
echo "🛑 To stop all services:"
echo "   - Press Ctrl+C in this terminal"
echo "   - Or run: docker compose down"
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
    if command -v docker compose &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    
    print_status "Development environment stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

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
    echo "   - Frontend: http://${EXTERNAL_IP}:5173"
    echo "   - Backend:  http://${EXTERNAL_IP}:3000"
    echo "   - pgAdmin:  http://${EXTERNAL_IP}:5050 (admin@ediens.lv / admin123)"
    echo ""
}

# Show initial status
show_status

echo "⏳ Press Ctrl+C to stop all services..."
echo "   Or run 'docker compose down' to stop only database services"

# Wait for user to stop
wait