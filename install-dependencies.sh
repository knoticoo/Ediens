#!/bin/bash

# Ediens Food Sharing App - Dependency Installation Script
# This script installs all dependencies for the full-stack application

echo "🍽️  Ediens Food Sharing App - Dependency Installation"
echo "=================================================="

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ ERROR: Node.js $REQUIRED_VERSION or higher is required!"
    echo "   Current version: $NODE_VERSION"
    echo ""
    echo "🔧 To fix this, please:"
    echo "   1. Install Node.js 18+ from https://nodejs.org/"
    echo "   2. Or use nvm: nvm install 18 && nvm use 18"
    echo "   3. Or use Docker: docker-compose up -d"
    echo ""
    echo "💡 Recommended: Use nvm for Node.js version management"
    echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "   nvm install 18 && nvm use 18"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Check npm version
echo "📋 Checking npm version..."
NPM_VERSION=$(npm -v)
REQUIRED_NPM="9.0.0"

if [ "$(printf '%s\n' "$REQUIRED_NPM" "$NPM_VERSION" | sort -V | head -n1)" != "$REQUIRED_NPM" ]; then
    echo "⚠️  WARNING: npm $REQUIRED_NPM or higher is recommended"
    echo "   Current version: $NPM_VERSION"
    echo "   Continuing with installation..."
fi

echo "✅ npm version $NPM_VERSION"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install root dependencies"
    exit 1
fi

# Install backend dependencies
echo ""
echo "🔧 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "🎨 Installing frontend dependencies..."
cd ../frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Return to root
cd ..

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. Set up environment variables: cp .env.example .env"
echo "   2. Start the development environment: ./start-dev.sh"
echo "   3. Or use Docker: docker-compose up -d"
echo ""
echo "📚 For more information, see README.md"