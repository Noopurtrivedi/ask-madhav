#!/bin/bash
# Ask Madhav — Push to GitHub
# Run this once from your Terminal: bash ~/Projects/AskMadhav/push_to_github.sh

set -e
cd ~/Projects/AskMadhav

echo "🪷 Ask Madhav — pushing to GitHub..."

# Remove stale git lock if present
rm -f .git/index.lock 2>/dev/null || true

# Make sure we're on main branch
git checkout -b main 2>/dev/null || git checkout main 2>/dev/null || true

# Stage and commit everything
git add .
git commit -m "🪷 Initial commit: Ask Madhav — Bhagavad Gita guidance app

- Django 5 + DRF backend with PostgreSQL
- Keyword-based verse retrieval engine (pgvector-ready)
- 30 real Bhagavad Gita verses (Sanskrit/Hindi/English + practical guidance)
- 5 Mahabharata story cards
- Next.js 14 + TypeScript + Tailwind CSS frontend
- Deep navy/saffron/gold design system
- Railway deployment config (railway.toml + Procfile)
- Vercel deployment config (vercel.json)
- Django admin for verses, chapters, stories
- Management command: python manage.py seed_data" 2>/dev/null || echo "Nothing new to commit"

# Set remote and push
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Noopurtrivedi/ask-madhav.git
git branch -M main
git push -u origin main

echo ""
echo "✅ Pushed to https://github.com/Noopurtrivedi/ask-madhav"
echo ""
echo "Next steps:"
echo "  1. Vercel (frontend): https://vercel.com/new/git/external?repo-url=https://github.com/Noopurtrivedi/ask-madhav"
echo "  2. Railway (backend): https://railway.app/new/github"
