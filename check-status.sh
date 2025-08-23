#!/bin/bash

# Ediens Food Sharing App - Service Status Check
# This script checks the status of all services without starting them

echo "🍽️  Ediens Food Sharing App - Service Status"
echo "============================================"

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

# Detect environment (VPS vs local)
detect_environment() {
    if [ -n "$SSH_CLIENT" ] || [ -n "$SSH_TTY" ]; then
        # We're on a remote server, get the external IP
        EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
        print_info "VPS Environment detected - External IP: $EXTERNAL_IP"
    else
        EXTERNAL_IP="localhost"
        print_info "Local Environment detected"
    fi
}

# Detect environment
detect_environment

# Check Docker status
echo ""
echo "🐳 Docker Status:"
if docker info > /dev/null 2>&1; then
    print_status "Docker is running"
else
    print_error "Docker is not running"
    exit 1
fi

# Check Docker services
echo ""
echo "📦 Docker Services:"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "ediens-postgres-1"; then
    POSTGRES_STATUS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "ediens-postgres-1" | awk '{print $2}')
    print_status "PostgreSQL: $POSTGRES_STATUS"
else
    print_error "PostgreSQL: Not running"
fi

if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "ediens-redis-1"; then
    REDIS_STATUS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "ediens-redis-1" | awk '{print $2}')
    print_status "Redis: $REDIS_STATUS"
else
    print_error "Redis: Not running"
fi

if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "ediens-pgadmin-1"; then
    PGADMIN_STATUS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "ediens-pgadmin-1" | awk '{print $2}')
    print_status "pgAdmin: $PGADMIN_STATUS"
else
    print_error "pgAdmin: Not running"
fi

# Check Node.js processes
echo ""
echo "🔧 Node.js Services:"
if lsof -ti:3000 > /dev/null 2>&1; then
    BACKEND_PID=$(lsof -ti:3000 | head -1)
    print_status "Backend (Port 3000): Running (PID: $BACKEND_PID)"
else
    print_error "Backend (Port 3000): Not running"
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    FRONTEND_PID=$(lsof -ti:5173 | head -1)
    print_status "Frontend (Port 5173): Running (PID: $FRONTEND_PID)"
else
    print_error "Frontend (Port 5173): Not running"
fi

# Check ports
echo ""
echo "🔌 Port Status:"
if lsof -i:3000 > /dev/null 2>&1; then
    print_status "Port 3000: In use (Backend)"
else
    print_error "Port 3000: Available"
fi

if lsof -i:5173 > /dev/null 2>&1; then
    print_status "Port 5173: In use (Frontend)"
else
    print_error "Port 5173: Available"
fi

if lsof -i:5432 > /dev/null 2>&1; then
    print_status "Port 5432: In use (PostgreSQL)"
else
    print_error "Port 5432: Available"
fi

if lsof -i:6379 > /dev/null 2>&1; then
    print_status "Port 6379: In use (Redis)"
else
    print_error "Port 6379: Available"
fi

if lsof -i:5050 > /dev/null 2>&1; then
    print_status "Port 5050: In use (pgAdmin)"
else
    print_error "Port 5050: Available"
fi

# Show access URLs
echo ""
echo "🌐 Access URLs:"
if lsof -i:5173 > /dev/null 2>&1; then
    print_status "Frontend: http://${EXTERNAL_IP}:5173"
else
    print_error "Frontend: Not accessible"
fi

if lsof -i:3000 > /dev/null 2>&1; then
    print_status "Backend:  http://${EXTERNAL_IP}:3000"
else
    print_error "Backend:  Not accessible"
fi

if lsof -i:5050 > /dev/null 2>&1; then
    print_status "pgAdmin:  http://${EXTERNAL_IP}:5050 (admin@ediens.lv / admin123)"
else
    print_error "pgAdmin:  Not accessible"
fi

# Check database connection
echo ""
echo "🗄️  Database Connection Test:"
if docker ps --format "table {{.Names}}" | grep -q "ediens-postgres-1"; then
    if docker exec ediens-postgres-1 pg_isready -U ediens_user -d ediens_db > /dev/null 2>&1; then
        print_status "PostgreSQL: Connection successful"
    else
        print_warning "PostgreSQL: Container running but connection failed"
    fi
else
    print_error "PostgreSQL: Container not running"
fi

if docker ps --format "table {{.Names}}" | grep -q "ediens-redis-1"; then
    if docker exec ediens-redis-1 redis-cli ping > /dev/null 2>&1; then
        print_status "Redis: Connection successful"
    else
        print_warning "Redis: Container running but connection failed"
    fi
else
    print_error "Redis: Container not running"
fi

# Summary
echo ""
echo "📊 Summary:"
echo "==========="

# Count running services
RUNNING_SERVICES=0
TOTAL_SERVICES=5

if docker ps --format "table {{.Names}}" | grep -q "ediens-postgres-1"; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi
if docker ps --format "table {{.Names}}" | grep -q "ediens-redis-1"; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi
if lsof -ti:3000 > /dev/null 2>&1; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi
if lsof -ti:5173 > /dev/null 2>&1; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi
if docker ps --format "table {{.Names}}" | grep -q "ediens-pgadmin-1"; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi

if [ $RUNNING_SERVICES -eq $TOTAL_SERVICES ]; then
    print_status "All services are running! ($RUNNING_SERVICES/$TOTAL_SERVICES)"
elif [ $RUNNING_SERVICES -gt 0 ]; then
    print_warning "Some services are running ($RUNNING_SERVICES/$TOTAL_SERVICES)"
else
    print_error "No services are running (0/$TOTAL_SERVICES)"
fi

echo ""
echo "💡 To start all services, run: ./start-dev.sh"
echo "🛑 To stop database services, run: docker compose down"