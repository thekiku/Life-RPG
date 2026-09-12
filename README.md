# QUESTLOG

full-stack retro handheld console life rpg with server-side xp/leveling, streaks, web audio synth, item shop, and pixel art ui

## features

- server-authoritative rpg engine - xp, levels, coins calculated server-side
- streak system - 9 day completion history
- four attributes - intellect, strength, craft, spirit (10 tiers each)
- item shop - buy and equip items with earned coins
- retro console ui - crt scanlines, power led, d-pad navigation
- web audio sfx - all sounds synthesized in-browser

## quick start

```bash
npm install
npm run seed
npm run dev
```

demo login: hero / demo1234

## tech stack

react 18, vite, web audio api, node.js, express, better-sqlite3, jwt, bcrypt

## deploy

```bash
vercel login
vercel --prod
```

set SESSION_SECRET env var in vercel dashboard

## gameplay

create quests with custom xp rewards, complete them to earn xp and coins, level up for confetti and synth fanfare, buy items in the shop

## sound effects

click: 200hz sine (50ms)
complete: rising chime (220->330->440hz)
level up: fanfare arpeggio
buy: cash register ka-ching
error: 100hz buzzer

## structure

```
questlog/
├── api/index.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── audio.js
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── db.js
│   │   └── engine.js
│   └── package.json
└── vercel.json
```

## api endpoints

- POST /api/auth/signup|login|logout
- GET /api/auth/me
- GET|POST|PUT|DELETE /api/tasks
- POST /api/tasks/:id/toggle
- GET /api/stats
- POST /api/stats/shop/buy|equip

## license

MIT
