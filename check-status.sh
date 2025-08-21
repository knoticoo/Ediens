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

# Check Docker status
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

# Check .env file
echo ""
echo "🔐 Environment Configuration:"
if [ -f .env ]; then
    print_status ".env file exists"
    if grep -q "DB_PASSWORD=" .env; then
        DB_PASSWORD=$(grep "DB_PASSWORD=" .env | cut -d'=' -f2)
        if [ "$DB_PASSWORD" != "your-database-password" ] && [ -n "$DB_PASSWORD" ]; then
            print_status "Database password: Configured"
        else
            print_warning "Database password: Not configured"
        fi
    else
        print_error "Database password: Missing"
    fi
else
    print_error ".env file missing"
fi

# Summary
echo ""
echo "📊 Summary:"
echo "==========="

RUNNING_SERVICES=0
TOTAL_SERVICES=5

if docker ps --format "table {{.Names}}" | grep -q "ediens-postgres-1"; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi
if docker ps --format "table {{.Names}}" | grep -q "ediens-redis-1"; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi
if lsof -ti:3000 > /dev/null 2>&1; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi
if lsof -ti:5173 > /dev/null 2>&1; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi
if [ -f .env ]; then RUNNING_SERVICES=$((RUNNING_SERVICES + 1)); fi

if [ $RUNNING_SERVICES -eq $TOTAL_SERVICES ]; then
    print_status "All services are running! ($RUNNING_SERVICES/$TOTAL_SERVICES)"
elif [ $RUNNING_SERVICES -gt 0 ]; then
    print_warning "Some services are running ($RUNNING_SERVICES/$TOTAL_SERVICES)"
else
    print_error "No services are running ($RUNNING_SERVICES/$TOTAL_SERVICES)"
fi

echo ""
echo "🚀 Quick Actions:"
echo "   - Start all services: ./start-dev.sh"
echo "   - Stop database services: docker-compose down"
echo "   - Install dependencies: ./install-dependencies.sh"
echo "   - Check this status again: ./check-status.sh"