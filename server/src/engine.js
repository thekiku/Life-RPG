// ─────────────────────────────────────────────────────────────────────────────
// QUESTLOG engine — this lives on the server so nobody can cheat their stats.
// All XP/level/streak math is computed here, never on the client.
// ─────────────────────────────────────────────────────────────────────────────

// Every 5 levels, XP-to-next-level grows by 1.4 so the grind keeps growing.
export function xpForLevel(level) {
  if (level < 1) level = 1;
  return Math.floor(100 * Math.pow(1.4, Math.floor((level - 1) / 5)));
}

// How much stat XP a quest grants, based on its reward amount.
export function attrXpFromReward(reward) {
  return Math.max(4, Math.min(40, Math.floor(reward / 5)));
}

// A character who gains XP may climb several levels, gaining HP (and then some
// bonus cooldown HP) each level. Returns the new state plus which levels were
// crossed so the UI can celebrate every single one.
export function applyXp(character, amount) {
  let { xp, level, max_hp: maxHp } = character;
  xp += amount;

  let leveledUpFrom = null;
  let leveledUpTo = null;

  while (xp >= xpForLevel(level) && level < 999) {
    const needed = xpForLevel(level);
    if (leveledUpFrom === null) leveledUpFrom = level;
    xp -= needed;
    level += 1;
    maxHp += 10 + (level % 5 === 0 ? 25 : 0); // +10 HP per level, +25 on every 5th
  }

  if (leveledUpFrom !== null) leveledUpTo = level;
  const gainedMaxHp = maxHp - character.max_hp;

  return {
    xp,
    level,
    gainedMaxHp,
    // Heal to full whenever anything levels the player up — an instant reward
    // for finishing quests.
    hp: leveledUpTo !== null ? maxHp : Math.min(maxHp, (character.hp ?? maxHp) + Math.max(2, Math.floor(amount / 10))),
    leveledUpFrom,
    leveledUpTo,
  };
}

// Attribute constellation → level table. Ten small tiers so stats feel like
// they are evolving without exploding the UI.
const ATTR_TIERS = [
  { level: 1, need: 0 },
  { level: 2, need: 60 },
  { level: 3, need: 160 },
  { level: 4, need: 320 },
  { level: 5, need: 540 },
  { level: 6, need: 830 },
  { level: 7, need: 1200 },
  { level: 8, need: 1660 },
  { level: 9, need: 2220 },
  { level: 10, need: 2900 },
];

export function attrTierLevel(totalXp) {
  let lvl = 1;
  for (const t of ATTR_TIERS) {
    if (totalXp >= t.need) lvl = t.level;
    else break;
  }
  return lvl;
}

export function attrTierProgress(totalXp) {
  const tier = attrTierLevel(totalXp);
  const cur = ATTR_TIERS.find((t) => t.level === tier);
  const next = ATTR_TIERS.find((t) => t.level === tier + 1);
  if (!next) return { level: tier, pct: 100, label: `ATTR TIER ${tier}` };
  const pct = Math.floor(((totalXp - cur.need) / (next.need - cur.need)) * 100);
  return { level: tier, pct: Math.max(0, Math.min(100, pct)), label: `ATTR TIER ${tier}` };
}

// Total tier count is tracked per attribute over all time so progress can be
// shown per stat rather than just "you raised this task".
export async function attrTotals(db, userId) {
  const rows = await db.all(
    `SELECT attr, SUM(reward) AS total
       FROM completion_log
      WHERE user_id = ?
        AND attr IN ('int','str','craft','spirit')
      GROUP BY attr`,
    [userId]
  );

  const out = { int: 0, str: 0, craft: 0, spirit: 0 };
  for (const r of rows) out[r.attr] = r.total ?? 0;
  return out;
}

export function attrDisplayName(attr) {
  return { int: 'INTELLECT', str: 'STRENGTH', craft: 'CRAFT', spirit: 'SPIRIT' }[attr] || 'INTELLECT';
}

const TYPE_TO_ATTR = { int: 'INTELLECT', str: 'STRENGTH', craft: 'CRAFT', spirit: 'SPIRIT' };
export { TYPE_TO_ATTR };

// Lodestone fates: a curated set of item presets used to populate the shop
// with personality and to seed fresh adventurers with flavor.
export const SHOP_CATALOG = [
  { slug: 'talisman', name: 'Pocket Talisman', description: 'A lumpy hunk of glass. Protects against forgetting why you started.', price: 120, kind: 'item', accent: '#ffd23f' },
  { slug: 'mug', name: 'Tactical Coffee Mug', description: 'Holds liquid motivation. Releases caffeine particles when filled.', price: 200, kind: 'item', accent: '#ff9f1c' },
  { slug: 'thinker', name: 'Thinker Emblem', description: 'Pin it on. Everyone within ten meters gains +1 curiosity.', price: 90, kind: 'item', accent: '#6bc9ff' },
  { slug: 'feather', name: 'Wayfarer\u2019s Feather', description: 'Once belonged to a very serious bird.', price: 75, kind: 'item', accent: '#c792ea' },
  { slug: 'trophy', name: 'Glass Trophy', description: 'Warm glow, zero substance, maximal pride.', price: 300, kind: 'item', accent: '#ff8fa3' },
  { slug: 'crown', name: 'Tiny Golden Crown', description: 'For when a feather is not enough.', price: 500, kind: 'item', accent: '#ffd23f' },
  { slug: 'crystal', name: 'Memory Crystal', description: 'Stores one beautiful day. Do not ask how.', price: 750, kind: 'item', accent: '#6bc9ff' },
];