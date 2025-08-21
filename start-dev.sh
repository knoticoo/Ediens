#!/bin/bash

# Ediens Food Sharing App - Development Environment Startup Script
# This script automatically sets up and starts the complete development environment

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
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running or not accessible"
    echo "   Please start Docker and try again"
    exit 1
fi
print_status "Docker is running"

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
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Check and create .env file with secure defaults
echo ""
echo "🔐 Setting up environment configuration..."
if [ ! -f .env ]; then
    print_info "Creating .env file with secure defaults..."
    
    # Generate secure passwords
    DB_PASSWORD=$(generate_secure_password)
    JWT_SECRET=$(openssl rand -base64 64)
    
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