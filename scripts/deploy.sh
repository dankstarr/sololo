#!/bin/bash

# Sololo Deployment Script
# This script helps you deploy to GitHub and Vercel

echo "🚀 Sololo Deployment Helper"
echo "=========================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Check if remote exists
if git remote | grep -q "origin"; then
    REMOTE_URL=$(git remote get-url origin)
    echo "✅ Git remote found: $REMOTE_URL"
    echo ""
    echo "To push to GitHub, run:"
    echo "  git push -u origin $CURRENT_BRANCH"
else
    echo "⚠️  No GitHub remote found"
    echo ""
    echo "To add GitHub remote, run:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/sololo.git"
    echo "  git push -u origin $CURRENT_BRANCH"
    echo ""
    echo "Replace YOUR_USERNAME with your GitHub username!"
fi

echo ""
echo "📦 To deploy to Vercel:"
echo "  1. Go to https://vercel.com"
echo "  2. Sign up/login with GitHub"
echo "  3. Click 'Add New Project'"
echo "  4. Import your 'sololo' repository"
echo "  5. Click 'Deploy'"
echo ""
echo "Or use Vercel CLI:"
echo "  npm i -g vercel"
echo "  vercel login"
echo "  vercel --prod"
echo ""
