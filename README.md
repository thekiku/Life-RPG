# Ascend (Life RPG)

Ascend is a gamified productivity web application built with Next.js and Supabase. It turns daily tasks and goals into RPG quests, granting experience points, gold, level progression, and stat attribute upgrades upon completion.

## Features

- User Authentication: Secure signup and login using Supabase Auth.
- Quest System: Create, track, filter, and complete tasks categorized by difficulty (Easy, Medium, Hard) and attributes.
- Character Attributes: Dynamic stat tracking across Intellect, Strength, Discipline, and Creativity.
- Level & XP Engine: Non-linear leveling progression curve calculated dynamically from earned XP.
- Bazaar & Shop: Purchase XP boost elixirs, gold magnets, streak shields, permanent attribute tomes, and interface themes (Void, Retro Terminal, Cozy Farmstead, Solar, Arctic, Crimson).
- Boss Nemesis & Raids: Weekly raid challenges with direct strike damage mechanics and reward caches.
- Telemetry & Activity Feed: History log tracking earned XP, gold, and stat increases over time.
- Immersive Audio & Theme Engine: Built-in synth audio effects and custom UI themes.
- Data Security: PostgreSQL Row Level Security (RLS) ensuring each user's data remains isolated.

## Tech Stack

- Framework: Next.js 15 (App Router, React 19, TypeScript)
- Database & Auth: Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- Icons: Lucide React
- Deployment: Vercel

## Environment Variables

Create a `.env.local` file in the project root with the following keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

## Database Setup

1. Open your Supabase project dashboard.
2. Go to the SQL Editor.
3. Run `supabase/schema.sql` to initialize tables, functions, triggers, and RLS policies.
4. Run `supabase/final_migration.sql` to ensure all columns and table relationships are up to date.

## Local Development

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Deployment

This repository is ready to deploy directly to Vercel.

1. Push your code to GitHub.
2. Import the repository into Vercel as a Next.js project.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Project Settings > Environment Variables.
4. Deploy.

## Demo Walkthrough

1. Register or sign in to an account.
2. Add a new task with an assigned attribute and difficulty level.
3. Complete the task to trigger XP, gold gains, and level-up audio-visual feedback.
4. Visit the Bazaar to purchase consumable boosts or unlock custom themes.
5. Inspect the Telemetry feed to verify historical log entries and persistent state across page reloads.

