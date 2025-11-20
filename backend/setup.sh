#!/bin/bash

echo "🚀 Setting up Drain SaaS Backend..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Generate encryption keys if .env doesn't exist
if [ ! -f ".env" ]; then
  echo "🔐 Generating encryption keys..."
  
  cp .env.example .env
  
  # Generate encryption key
  ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  echo "Generated ENCRYPTION_KEY: $ENCRYPTION_KEY"
  
  # Generate JWT secret
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  echo "Generated JWT_SECRET: $JWT_SECRET"
  
  # Generate master seed
  MASTER_SEED=$(node -e "console.log(require('bip39').generateMnemonic())")
  echo "Generated MASTER_WALLET_SEED: $MASTER_SEED"
  echo ""
  
  # Update .env file
  sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  sed -i "s/MASTER_WALLET_SEED=.*/MASTER_WALLET_SEED=$MASTER_SEED/" .env
  
  echo "✅ .env file created with generated keys"
  echo ""
  echo "⚠️  IMPORTANT: Add your RPC endpoints to .env:"
  echo "   - ALCHEMY_KEY"
  echo "   - COVALENT_API_KEY"
  echo "   - DATABASE_URL (already set from Coolify)"
  echo ""
else
  echo "✅ .env file already exists"
  echo ""
fi

# Generate Prisma client
echo "📊 Generating Prisma client..."
npm run prisma:generate
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate
echo ""

echo "✨ Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev:all    # Start API + Workers"
echo ""
echo "To view database:"
echo "  npm run prisma:studio"
echo ""
echo "To test API:"
echo "  curl http://localhost:3001/health"
echo ""
