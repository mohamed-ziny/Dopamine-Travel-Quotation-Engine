#!/bin/bash

# Dopamine Travel - Quick Start Script
# This script starts everything you need

echo "╔════════════════════════════════════════════╗"
echo "║  🚀 Dopamine Travel Quotation System      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MongoDB is running
echo "📊 Checking MongoDB..."
if systemctl is-active --quiet mongodb; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB is not running. Starting...${NC}"
    sudo systemctl start mongodb
    sleep 2
    if systemctl is-active --quiet mongodb; then
        echo -e "${GREEN}✅ MongoDB started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start MongoDB${NC}"
        echo "Please run: sudo systemctl start mongodb"
        exit 1
    fi
fi

echo ""

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Error: Not in the API directory${NC}"
    echo "Please run this script from the travel-quotation-api folder"
    echo ""
    echo "Example:"
    echo "  cd travel-quotation-api"
    echo "  ./start.sh"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Check MongoDB connection
echo "🔍 Testing MongoDB connection..."
if mongosh --eval "db.version()" --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB connection successful${NC}"
    
    # Check if data exists
    QUOTE_COUNT=$(mongosh dopamine-travel --eval "db.quotations.countDocuments()" --quiet 2>/dev/null | tail -1)
    USER_COUNT=$(mongosh dopamine-travel --eval "db.users.countDocuments()" --quiet 2>/dev/null | tail -1)
    
    echo -e "${GREEN}📊 Database status:${NC}"
    echo "   - Quotations: $QUOTE_COUNT"
    echo "   - Users: $USER_COUNT"
    
    if [ "$QUOTE_COUNT" = "0" ] || [ "$USER_COUNT" = "0" ]; then
        echo -e "${YELLOW}⚠️  Database is empty. Consider running: python3 simple-import.py${NC}"
    fi
else
    echo -e "${RED}❌ Cannot connect to MongoDB${NC}"
    echo "Please check: sudo systemctl status mongodb"
fi

echo ""
echo "════════════════════════════════════════════"
echo ""
echo -e "${GREEN}🚀 Starting API Server...${NC}"
echo ""
echo "The application will be available at:"
echo -e "${GREEN}http://localhost:5000/${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "════════════════════════════════════════════"
echo ""

# Start the server
npm run dev
