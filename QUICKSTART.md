# GhostChat — Quick Start Guide

## 📦 Project Structure

```
GhostChat/
├── app/
│   ├── layout.js                 ← Root layout
│   ├── page.js                   ← Join screen
│   ├── page.module.css           ← Join screen styles
│   ├── globals.css               ← Global styles
│   ├── room/
│   │   └── [roomId]/
│   │       ├── page.js           ← Chat screen component
│   │       └── page.module.css   ← Chat styles
│   └── api/
│       └── signal/
│           └── route.js          ← Pusher relay endpoint
├── lib/
│   └── crypto.js                 ← Web Crypto API functions
├── public/                        ← Static files
├── .env.local.example            ← Env template
├── .gitignore                    ← Git ignore rules
├── package.json                  ← Dependencies & scripts
├── next.config.js                ← Next.js config
├── jsconfig.json                 ← Path aliases
├── vercel.json                   ← Vercel deployment config
├── README.md                     ← Full documentation
├── VERIFICATION.md               ← Security checklist
└── QUICKSTART.md                 ← This file
```

## 🚀 Local Development (5 mins)

### 1. Install dependencies
```bash
cd GhostChat
npm install
```

### 2. Set up Pusher credentials
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with Pusher credentials from https://pusher.com:
```
PUSHER_APP_ID=abc123
PUSHER_KEY=xyz789
PUSHER_SECRET=secret123
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=xyz789
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
```

### 3. Run dev server
```bash
npm run dev
```

Open http://localhost:3000 in two browser windows to test!

## 🎯 Testing Flow

1. **Window 1**: Go to http://localhost:3000
2. **Window 1**: Click "Generate Room ID" → copies ID
3. **Window 2**: Go to http://localhost:3000
4. **Window 2**: Paste same Room ID → click "Enter Room"
5. **Window 1**: Now click "Enter Room" with same ID
6. Both see "User joined" message
7. Type encrypted messages — they appear instantly!
8. Close one window → other sees "User left"

## 🌐 Deploy to Vercel (10 mins)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ghostchat.git
git push -u origin main
```

### 2. Create Vercel project
- Go to https://vercel.com/new
- Import your GitHub repo
- Add environment variables (same 6 from `.env.local`)
- Deploy!

### 3. Share your app
Your Vercel URL + any Room ID = ready to chat! 🎉

Example: `https://ghostchat-xyz.vercel.app/?room=MYROOM`

## 🔐 Security Highlights

✅ **ECDH P-256 key exchange** — Only you two derive the shared key
✅ **AES-GCM encryption** — 256-bit authenticated encryption
✅ **Ephemeral storage** — Messages vanish on page unload
✅ **Zero database** — No logs, no history, no traces
✅ **Client-only crypto** — All encryption happens in your browser

## 🛠 Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Lint code
```

## 📁 File Guide

| File | Purpose |
|------|---------|
| `lib/crypto.js` | Web Crypto API: ECDH + AES-GCM |
| `app/page.js` | Join screen: enter/generate Room ID |
| `app/room/[roomId]/page.js` | Chat screen: messages + encryption |
| `app/api/signal/route.js` | Server relay: POST event via Pusher |
| `app/globals.css` | Dark theme + base styles |

## 🔄 Message Flow

```
User A: "Hello" → encrypt → POST /api/signal
         ↓
Server: → Pusher.trigger(roomId, 'message', encrypted)
         ↓
User B: ← Pusher event received → decrypt → show
```

**Key point**: Server never sees "Hello" — only encrypted ciphertext!

## ✅ Checklist Before Deploying

- [ ] Pusher account created (https://pusher.com)
- [ ] All 6 env vars in Vercel dashboard
- [ ] Pusher "Client Events" = OFF in Settings
- [ ] Tested locally in 2 browser windows
- [ ] Messages encrypted (can't read raw text)
- [ ] Clearing browser cache doesn't restore messages

## ❌ Known Limitations

- Max **2 people per room** (1-to-1 only, uses single ECDH key)
- Max **32 chars** for Room ID
- Messages **vanish on page close** (no history) ✅ (this is intentional!)
- No **multi-device** support (state per browser tab)

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Pusher credentials missing" | Check all 6 vars in .env.local |
| "Cannot connect" | Verify Pusher status at pusher.com |
| Messages not sending | Ensure both users in same room |
| Stuck on "Waiting for peer" | Share exact Room ID with peer |

## 📚 Learn More

- [README.md](./README.md) — Full documentation
- [VERIFICATION.md](./VERIFICATION.md) — Security checklist
- [lib/crypto.js](./lib/crypto.js) — Crypto internals
- [app/room/[roomId]/page.js](./app/room/[roomId]/page.js) — Chat logic

## 🎓 Next Steps

1. ✅ Run locally
2. ✅ Test with a friend
3. ✅ Deploy to Vercel
4. ✅ Share the URL!

**No data. No traces. Just chat.** 👻

---

Questions? See [README.md](./README.md#-faq) FAQ section!
