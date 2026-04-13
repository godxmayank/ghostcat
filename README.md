# 👻 GhostChat

**Zero-data, end-to-end encrypted, room-based chat**

GhostChat is an ephemeral encrypted chat application where:
- **No accounts** — Join any room with just a Room ID
- **No history** — Messages vanish when you leave
- **No traces** — All encryption happens in the browser; server never sees message content
- **No database** — Zero persistent storage

## 🔒 Security

- **End-to-end encryption**: ECDH key exchange (P-256) + AES-GCM message encryption
- **Client-side only**: All cryptography happens in your browser using Web Crypto API
- **Ephemeral**: Messages exist only in memory; cleared on page unload
- **No metadata leaks**: Server only handles room IDs, never logs encrypted content

## ⚡ Architecture

- **Frontend**: Next.js 14 (App Router)
- **Real-time**: Pusher Channels (free tier)
- **Hosting**: Vercel (serverless)
- **Crypto**: Web Crypto API (P-256 ECDH + AES-GCM)
- **Storage**: 0 KB (zero database)

## 🚀 Quick Start

### 1. Clone or download this project

```bash
git clone <your-repo>
cd GhostChat
```

### 2. Set up Pusher (free)

1. Go to https://pusher.com
2. Create a free account
3. Create a new Channels app
4. Select your closest cluster (e.g., `ap2` for Asia-Pacific)
5. In your app dashboard, note:
   - **App ID**
   - **Key**
   - **Secret**
   - **Cluster**
6. Go to **App Settings** → enable **"Client Events" = OFF** (we use server events only)

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

### 4. Install dependencies

```bash
npm install
```

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 📱 How to Use

1. **Join Screen**: Enter or generate a Room ID (6 alphanumeric characters)
2. **Chat Screen**: Share the Room ID with someone
   - When they join, your keys automatically exchange (ECDH)
   - A shared AES key is derived — only you two can decrypt
   - Type and send encrypted messages
3. **Messages**: All messages are encrypted before leaving your browser
4. **Leave**: Close the tab/browser — messages vanish, peer notified

## 🌐 Deploy to Vercel

### 1. Push to GitHub

```bash
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Create Vercel project

- Go to https://vercel.com
- Import your GitHub repo
- Set environment variables:
  - `PUSHER_APP_ID`
  - `PUSHER_KEY`
  - `PUSHER_SECRET`
  - `PUSHER_CLUSTER`
  - `NEXT_PUBLIC_PUSHER_KEY`
  - `NEXT_PUBLIC_PUSHER_CLUSTER`

### 3. Deploy

```bash
vercel deploy --prod
```

Share your Vercel URL + any Room ID with friends to start chatting!

## 🔐 Security Guarantees

✅ **What is encrypted:**
- All message content (AES-GCM)
- Key exchange is forward-secure (ECDH)

✅ **What the server never stores:**
- Message content
- User keys
- Chat history
- Logs of encrypted data

✅ **What is ephemeral:**
- Messages (React state only)
- Keys (ref-only, cleared on unmount)
- User identity (random peer ID, never logged)

❌ **Not encrypted by GhostChat:**
- Room ID (necessary for discovery)
- Connection metadata (Pusher sees channel name)

## 🛠 Technical Details

### Room ID
- Max 32 characters (alphanumeric + hyphens)
- Used as Pusher channel name
- No special escaping needed

### Key Exchange (ECDH P-256)

1. Each client generates a local ECDH keypair
2. Public keys exchange via `share-key` event
3. Both derive the same 256-bit AES key
4. All messages encrypted with this key

### Message Flow

```
User A types "Hello"
    ↓
encryptMessage(text, sharedKey) → {ciphertext, iv}
    ↓
POST /api/signal with event="message"
    ↓
Server triggers Pusher event (no logging of content)
    ↓
User B receives event
    ↓
decryptMessage({ciphertext, iv}, sharedKey) → "Hello"
```

### API Endpoints

**POST `/api/signal`**

Request:
```json
{
  "roomId": "MYROOM",
  "event": "message|share-key|peer-joined|peer-left",
  "data": {...}
}
```

Response:
```json
{
  "ok": true
}
```

The server never logs `data.ciphertext` or any message content.

## 🎨 Responsive Design

- **320px** (small phone) ✅
- **375px** (iPhone SE) ✅
- **768px** (tablet) ✅
- **1280px+** (desktop) ✅

All UI elements are touch-friendly (min 44px tap targets).

## 📦 Dependencies

- `next@^14.0.0` — Framework
- `react@^18.2.0` — UI
- `react-dom@^18.2.0` — DOM rendering
- `pusher@^5.2.0` — Server-side Pusher
- `pusher-js@^8.4.0` — Client-side Pusher

## 🚫 What's NOT in This App

- ❌ Database (no Prisma, MongoDB, Supabase)
- ❌ Authentication (no NextAuth, Clerk)
- ❌ User accounts or profiles
- ❌ Message logging or history
- ❌ Analytics or tracking
- ❌ localStorage/sessionStorage (memory-only)

## 🐛 Troubleshooting

### "Configuration error: Pusher credentials missing"
- Check `.env.local` has all 6 variables
- Verify `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` are correct
- Restart dev server after env changes

### "Messages not sending"
- Ensure peer has joined (you'll see system message)
- Check Pusher dashboard for any connection errors
- Verify network tab shows POST `/api/signal` succeeding

### "Waiting for peer to connect..." (stuck)
- Share the exact Room ID with your peer
- Verify they're using the same public Vercel URL (if deployed)
- Check Pusher dashboard that events are flowing

### Room ID doesn't allow certain characters
- Room IDs are limited to 32 characters
- Allowed: letters, numbers, hyphens, underscores
- Use `Generate Room ID` button for valid IDs

## 📄 License

This project is provided as-is. Feel free to modify and deploy.

## 🙋 FAQ

**Q: Can you see my messages?**
A: No. Messages are encrypted in your browser before leaving. The server only sees a roomId and an encrypted blob.

**Q: What happens when I close the tab?**
A: All messages are deleted from memory. The peer sees "User left" message.

**Q: Can I have more than 2 people in a room?**
A: Currently, 2 people per room (one shared ECDH key). Supporting N people would require a different design.

**Q: Is this production-ready?**
A: This is a demo/proof-of-concept. For production:
  - Add rate limiting on the API
  - Monitor Pusher for abuse
  - Consider user-agent spoofing attacks
  - Add CORS headers if needed

**Q: How do you monetize this if there's no data?**
A: There's no business model — it's a privacy-first tool. Host it yourself or use Vercel's free tier.

---

**Built with ❤️ and cryptography. No data. No traces. Just chat.**
