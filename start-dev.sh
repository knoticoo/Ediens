#!/bin/bash

# Ediens Food Sharing App - Development Environment Startup Script
# This script starts the complete development environment

echo "🍽️  Ediens Food Sharing App - Development Startup"
echo "================================================"

# Check if Docker is running
echo "🐳 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running or not accessible"
    echo "   Please start Docker and try again"
    exit 1
fi

echo "✅ Docker is running"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo "   Please review and update the .env file with your configuration"
    else
        echo "❌ No .env.example file found"
        echo "   Please create a .env file with your configuration"
        exit 1
    fi
fi

# Start Docker services
echo ""
echo "🚀 Starting Docker services (PostgreSQL, Redis)..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start Docker services"
    exit 1
fi

echo "✅ Docker services started successfully"

# Wait for database to be ready
echo ""
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check database connection
echo "🔍 Testing database connection..."
cd backend
npm run db:test 2>/dev/null || echo "⚠️  Database test command not found, continuing..."

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
npm run db:migrate 2>/dev/null || echo "⚠️  Migration command not found, continuing..."

# Seed database if needed
echo ""
echo "🌱 Seeding database..."
npm run db:seed 2>/dev/null || echo "⚠️  Seed command not found, continuing..."

cd ..

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
echo "✅ Development environment started successfully!"
echo ""
echo "🌐 Services running:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://localhost:3000"
echo "   - Database: localhost:5432"
echo "   - Redis:    localhost:6379"
echo ""
echo "📱 Test the notification system:"
echo "   - Visit: http://localhost:5173/demo/notifications"
echo "   - Click notification buttons to test"
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
    
    echo "✅ Development environment stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
echo "⏳ Press Ctrl+C to stop all services..."
wait