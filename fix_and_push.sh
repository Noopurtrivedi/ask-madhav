#!/bin/bash
# Ask Madhav — Fix Vercel build error and push
# Run: bash ~/Projects/AskMadhav/fix_and_push.sh

set -e
cd ~/Projects/AskMadhav

echo "🔧 Fixing Next.js config (removing .ts version)..."

# Remove the unsupported .ts config (Next.js 14 needs .js)
rm -f frontend/next.config.ts

# Stage and commit the fix
git add -A
git commit -m "fix: replace next.config.ts with next.config.js (Next.js 14 compatibility)"

# Push to trigger Vercel redeploy
git push origin main

echo ""
echo "✅ Fix pushed! Vercel will redeploy automatically."
echo "Watch progress at: https://vercel.com/noopurtrivedis-projects/ask-madhav"
