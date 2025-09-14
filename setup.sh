#!/bin/bash

# Environment Setup Script for CA Practice Automation

echo "🚀 Setting up environment for CA Practice Automation"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating one..."
    cat > .env << EOF
DATABASE_URL=file:./db/custom.db

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Google OAuth (Optional - for Google sign-in)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF
    echo "✅ .env file created with random NEXTAUTH_SECRET"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npm run db:generate

# Push database schema
echo "🏗️  Pushing database schema..."
npm run db:push

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. To enable Google OAuth, visit https://console.cloud.google.com/"
echo "   and set up OAuth 2.0 credentials, then update GOOGLE_CLIENT_ID and"
echo "   GOOGLE_CLIENT_SECRET in your .env file"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"