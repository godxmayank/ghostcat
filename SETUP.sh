#!/bin/bash
# GhostChat — Quick Setup Commands
# Copy-paste these commands to get started in 5 minutes

# ============================================
# 1. NAVIGATE TO PROJECT
# ============================================
cd <your-project-folder>

# ============================================
# 2. COPY ENV TEMPLATE
# ============================================
cp .env.local.example .env.local
# 👉 Now edit .env.local with Pusher credentials:
#    - PUSHER_APP_ID
#    - PUSHER_KEY
#    - PUSHER_SECRET
#    - PUSHER_CLUSTER
#    - NEXT_PUBLIC_PUSHER_KEY
#    - NEXT_PUBLIC_PUSHER_CLUSTER

# ============================================
# 3. INSTALL DEPENDENCIES
# ============================================
npm install

# ============================================
# 4. RUN LOCAL DEV SERVER
# ============================================
npm run dev
# 👉 Open http://localhost:3000 in two browser windows

# ============================================
# 5. TEST THE APP
# ============================================
# Window 1: Click "Generate Room ID"
# Window 2: Enter same Room ID
# Both: Send encrypted messages!

# ============================================
# 6. BUILD FOR PRODUCTION
# ============================================
npm run build  # Creates optimized build
npm run start  # Run production server locally

# ============================================
# 7. DEPLOY TO VERCEL (GitHub required)
# ============================================
git init
git add .
git commit -m "Initial commit: GhostChat"
git remote add origin https://github.com/YOUR_USERNAME/ghostchat
git push -u origin main
# 👉 Then on vercel.com:
#    1. Import GitHub repo
#    2. Add 6 environment variables
#    3. Click Deploy!

# ============================================
# 8. VERIFY DEPLOYMENT
# ============================================
# 1. Visit your Vercel URL
# 2. Open in 2 browser windows
# 3. Both enter same Room ID
# 4. Messages encrypt/decrypt correctly
# 5. Close one window → see "User left"

# ============================================
# TROUBLESHOOTING
# ============================================

# If you get "Pusher credentials missing":
#   → Check .env.local has all 6 variables
#   → Make absolutely sure NEXT_PUBLIC_* vars are set
#   → Restart dev server after editing .env.local

# If dev server doesn't start:
#   → Delete node_modules: rm -r node_modules
#   → Reinstall: npm install
#   → Try again: npm run dev

# If npm install fails on Windows:
#   → Open PowerShell as Admin
#   → Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#   → Try again: npm install

# If messages don't send:
#   → Verify both users in SAME room
#   → Check browser console for errors
#   → Verify Pusher credentials in .env.local
#   → Check pusher.com dashboard (app should show as online)

# ============================================
# ENVIRONMENT SETUP (Pusher)
# ============================================
# 1. Go to https://pusher.com
# 2. Create free account
# 3. Create new "Channels" app
# 4. Select your closest cluster (ap2 for Asia, eu for Europe, etc.)
# 5. Copy App ID, Key, Secret, Cluster
# 6. Paste into .env.local
# 7. In Pusher dashboard → App Settings:
#    - Set "Client Events" = OFF (we use server events only)
#    - Confirm TLS/SSL = ON

# ============================================
# FILE STRUCTURE CREATED
# ============================================
# GhostChat/
# ├── app/
# │   ├── layout.js              ← Root layout
# │   ├── page.js                ← Join screen
# │   ├── page.module.css
# │   ├── globals.css
# │   ├── room/[roomId]/
# │   │   ├── page.js            ← Chat screen
# │   │   └── page.module.css
# │   └── api/signal/
# │       └── route.js           ← Pusher relay API
# ├── lib/
# │   └── crypto.js              ← ECDH + AES-GCM
# ├── .env.local                 ← (create from .env.local.example)
# ├── package.json
# ├── vercel.json
# ├── README.md
# ├── QUICKSTART.md
# ├── VERIFICATION.md
# └── DEPLOYMENT_READY.md

# ============================================
# KEY FILES EXPLAINED
# ============================================

# lib/crypto.js
#   - generateKeyPair()     → Create ECDH P-256 keypair
#   - exportPublicKey()     → Convert to Base64
#   - importPublicKey()     → Load peer's Base64 key
#   - deriveSharedKey()     → ECDH + AES-256 derivation
#   - encryptMessage()      → AES-GCM encrypt with random IV
#   - decryptMessage()      → AES-GCM decrypt

# app/page.js
#   - Join screen UI
#   - "Generate Room ID" button (random 6-char)
#   - "Enter Room" button (navigates to /room/[roomId])

# app/room/[roomId]/page.js
#   - Chat screen component
#   - ECDH key exchange
#   - Real-time messaging
#   - Encryption/decryption lifecycle

# app/api/signal/route.js
#   - POST /api/signal endpoint
#   - Validates roomId and event type
#   - Relays via Pusher (NO storage)
#   - Returns 200 OK with {ok: true}

# ============================================
# TESTING CHECKLIST
# ============================================

# ✅ Does npm install succeed?
# ✅ Does npm run dev start without errors?
# ✅ Does http://localhost:3000 load?
# ✅ Can you generate a Room ID?
# ✅ Can you enter a Room ID?
# ✅ Does Chat screen load?
# ✅ Do two users see "User joined"?
# ✅ Can you send encrypted messages?
# ✅ Can peer decrypt and see message?
# ✅ Do messages display immediately (optimistic)?
# ✅ Does UI scroll to latest message?
# ✅ Does "User left" appear when closing browser?
# ✅ Are messages cleared on page unload?
# ✅ Does UI work on mobile (375px)?
# ✅ Does Enter key send message?
# ✅ Is Send button disabled until peer joins?

# ============================================
# PRODUCTION DEPLOYMENT (Vercel)
# ============================================

# Environment variables to add in Vercel dashboard:
# 1. PUSHER_APP_ID
# 2. PUSHER_KEY
# 3. PUSHER_SECRET
# 4. PUSHER_CLUSTER
# 5. NEXT_PUBLIC_PUSHER_KEY
# 6. NEXT_PUBLIC_PUSHER_CLUSTER

# After deployment:
# - npm run build    (creates .next/ folder)
# - npm run start    (runs production server)
# - Open Vercel URL  (auto-deployed on git push)

# ============================================
# DOCUMENTATION
# ============================================

# README.md          → Complete guide, setup, deployment, FAQ
# QUICKSTART.md      → 5-minute quick start
# VERIFICATION.md    → Security checklist (100+ items)
# DEPLOYMENT_READY.md → This deployment readiness report
# SETUP.sh           → This file (quick command reference)

# ============================================
# SECURITY FEATURES
# ============================================

# ✅ ECDH P-256       → Forward-secure key exchange
# ✅ AES-GCM          → Authenticated encryption
# ✅ Random IV        → Unique per message
# ✅ Web Crypto API   → Browser native, no Node.js crypto
# ✅ Ephemeral state  → Messages cleared on unload
# ✅ Zero database    → No persistence
# ✅ No auth          → Join with Room ID only
# ✅ No logging       → Server never stores encrypted data

# ============================================
# NEXT STEPS
# ============================================

# 1. Copy GhostChat folder to your workspace
# 2. Set up Pusher account (3 minutes)
# 3. Run npm install (1 minute)
# 4. Edit .env.local with Pusher credentials (1 minute)
# 5. Run npm run dev (1 minute)
# 6. Test in 2 browser windows (2 minutes)
# 7. Deploy to Vercel (5 minutes)
# 8. Share Vercel URL + Room ID with friends!

# ============================================
# That's it! You now have a fully encrypted
# zero-data chat app. No accounts, no history,
# no traces. Just encrypted messages. 👻
# ============================================
