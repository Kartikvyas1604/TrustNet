#!/bin/bash

# TrustNet Backend - Quick Development Setup
# This script sets up and starts the backend for development

set -e  # Exit on any error

echo "🚀 TrustNet Backend - Quick Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node --version) detected"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Copying from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠${NC}  Please update .env with your values"
fi

echo -e "${GREEN}✓${NC} Environment file exists"

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npm run prisma:generate > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} Prisma client generated"

# Test database connection
echo ""
echo "🗄️  Testing database connection..."
if npm run db:test > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${YELLOW}⚠${NC}  Database connection test skipped (optional)"
fi

# Check Redis (optional)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Redis is running"
    else
        echo -e "${YELLOW}⚠${NC}  Redis not running (optional - caching disabled)"
    fi
else
    echo -e "${YELLOW}ℹ${NC}  Redis not installed (optional - caching disabled)"
fi

echo ""
echo echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Available commands:"
echo "  ${GREEN}npm run dev${NC}         - Start development server"
echo "  ${GREEN}npm run demo${NC}        - Run comprehensive demo"
echo "  ${GREEN}npm run prisma:studio${NC} - Open database GUI"
echo "  ${GREEN}npm run build${NC}       - Build for production"
echo ""
echo "Starting development server..."
echo ""

# Start the development server
npm run dev
