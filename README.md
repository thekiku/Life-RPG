# 🎮 QUESTLOG — Handheld Life RPG

A full-stack retro handheld console Life RPG app featuring server-authoritative XP/leveling/streaks, dynamic Web Audio synth sound effects, attribute progression, item shop, and pixel-art UI.

## 🌟 Features

- **Server-Authoritative RPG Engine** — XP, levels, coins, attribute experience calculated server-side
- **Streak System** — 9-day completion history with visual matrix
- **Four Attributes** — Intellect, Strength, Craft, Spirit (10 tiers each)
- **Item Shop** — Purchase and equip relics with earned coins
- **Retro Console UI** — CRT scanlines, power LED, D-pad navigation
- **Web Audio SFX** — All sounds synthesized in-browser (no audio files)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Seed demo data
npm run seed

# Development (frontend :5173, backend :4000)
npm run dev

# Production (serves on :4000)
npm run build
NODE_ENV=production npm start
```

**Demo Login:** `hero` / `demo1234`

## 📦 Tech Stack

- **Frontend:** React 18, Vite, Web Audio API, Canvas Confetti
- **Backend:** Node.js 24+, Express, better-sqlite3
- **Auth:** JWT cookies, BCrypt
- **Deployment:** Vercel-ready

## 🚢 Deploy to Vercel

```bash
vercel login
vercel --prod
```

Add environment variable in Vercel dashboard: `SESSION_SECRET=your-random-secret`

## 🎮 Gameplay

1. Create quests with custom XP rewards (5-500)
2. Complete quests to earn XP and Gold Coins
3. Level up triggers confetti + synth fanfare
4. Buy items in shop with coins
5. Build attribute progression across 4 stats

## 🎨 Sound Effects (Web Audio API)

- **Click:** 200Hz sine (50ms)
- **Complete:** Rising chime (220→330→440Hz)
- **Level Up:** Fanfare arpeggio
- **Buy:** Cash register ka-ching
- **Error:** 100Hz buzzer

## 📁 Structure

```
questlog/
├── api/index.js          # Vercel serverless entry
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # HeaderHUD, Modals
│   │   ├── pages/        # QuestLog, Character, Shop
│   │   └── audio.js      # Synth engine
│   └── vite.config.js
├── server/               # Express backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── db.js         # SQLite with async wrapper
│   │   └── engine.js     # XP/level math
│   └── package.json
└── vercel.json           # Deployment config
```

## 🔧 API Endpoints

- `POST /api/auth/signup|login|logout`
- `GET /api/auth/me`
- `GET|POST|PUT|DELETE /api/tasks`
- `POST /api/tasks/:id/toggle`
- `GET /api/stats`
- `POST /api/stats/shop/buy|equip`

## 📝 License

MIT — Built with ❤️ and synthesized bleeps.
