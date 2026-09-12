# Life RPG

A full-stack gamified productivity app that turns real-life tasks into quests.

## Features
- Email/password authentication with Supabase
- Persistent PostgreSQL database
- Row Level Security so users can only access their own data
- Quest CRUD
- Non-linear XP leveling
- Difficulty-based XP/gold rewards
- Character attributes: Intellect, Strength, Discipline, Creativity
- Reward-vault preview
- Activity logging
- Responsive, keyboard-friendly interface
- Optimistic UI for fast interactions

## Tech stack
- Next.js + React + TypeScript
- Supabase Auth + PostgreSQL
- Custom CSS
- Lucide icons

## Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Add your Supabase project URL and anon key.
5. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy
Deploy the repository to Vercel and add the same environment variables in Vercel project settings.

## Suggested demo flow (90–180 seconds)
1. Show signup/login.
2. Add a new quest.
3. Complete it.
4. Show XP/gold/attribute increase.
5. Refresh the page to prove persistence.
6. Show responsive/mobile layout.
7. Sign out and sign back in.

## Submission checklist
- Public GitHub repository
- At least 3 chronological commits
- `.env.example` included
- Live deployed URL works
- Walkthrough video under 100 MB and 90–180 seconds
- No private secrets committed
