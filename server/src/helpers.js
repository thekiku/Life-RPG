import { getDb } from './db.js';

const DAY_MS = 86400000;

export function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function lastNDays(n = 9, endDate = todayStr()) {
  const endMs = Date.parse(endDate + 'T00:00:00Z');
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(endMs - i * DAY_MS).toISOString().slice(0, 10));
  }
  return out;
}

function daysBetween(aStr, bStr) {
  return Math.round((Date.parse(aStr + 'T00:00:00Z') - Date.parse(bStr + 'T00:00:00Z')) / DAY_MS);
}

export async function currentStreak(userId) {
  const db = await getDb();
  const rows = await db.all(
    'SELECT DISTINCT completed_on FROM completion_log WHERE user_id = ? ORDER BY completed_on ASC',
    [userId]
  );
  if (rows.length === 0) return { count: 0, lastDay: null };

  const days = rows.map((r) => r.completed_on);
  const newest = days[days.length - 1];
  let count = 1;
  let expect = newest;

  for (let i = days.length - 2; i >= 0; i--) {
    const d = days[i];
    const diff = daysBetween(expect, d);
    if (diff === 1) {
      count += 1;
      expect = d;
    } else if (diff === 2) {
      if (newest === expect) {
        expect = d;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return { count, lastDay: newest };
}

export const refreshStreak = currentStreak;
