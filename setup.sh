#!/bin/bash

# TrustNet Quick Setup Script
echo "🚀 Setting up TrustNet..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Install root dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

# Setup env files if they don't exist
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚙️  Creating .env.local from example...${NC}"
    cp .env.example .env.local
fi

if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚙️  Creating backend/.env from example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env and add your DATABASE_URL${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit backend/.env and add your DATABASE_URL from Neon.tech"
echo "2. Run: npm run db:setup (to initialize database)"
echo "3. Run: npm run dev:all (to start both frontend and backend)"
echo ""
echo -e "${GREEN}For deployment instructions, see DEPLOYMENT.md${NC}"
