import { Router } from 'express';
import { getDb } from '../db.js';
import { xpForLevel, attrTierProgress, SHOP_CATALOG } from '../engine.js';
import { currentStreak, lastNDays } from '../helpers.js';

export const statRouter = Router();

// GET /api/stats — full dashboard state
statRouter.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const character = await db.get('SELECT * FROM characters WHERE user_id = ?', [req.userId]);
    if (!character) {
      return res.status(404).json({ error: 'NO_CHARACTER', message: 'Character profile missing.' });
    }

    const streak = await currentStreak(req.userId);
    const nextLevelXp = xpForLevel(character.level);
    const streakDays = lastNDays(9);

    const completedLog = await db.all(
      'SELECT DISTINCT completed_on FROM completion_log WHERE user_id = ? AND completed_on >= ?',
      [req.userId, streakDays[0]]
    );
    const activeSet = new Set(completedLog.map((r) => r.completed_on));

    const historyMatrix = streakDays.map((dateStr) => ({
      date: dateStr,
      active: activeSet.has(dateStr),
    }));

    const attributes = {
      int: attrTierProgress(character.attr_int || 0),
      str: attrTierProgress(character.attr_str || 0),
      craft: attrTierProgress(character.attr_craft || 0),
      spirit: attrTierProgress(character.attr_spirit || 0),
    };

    const userInventory = await db.all('SELECT item_slug, equipped FROM inventory WHERE user_id = ?', [req.userId]);

    const inventorySlugs = new Set(userInventory.map((i) => i.item_slug));
    const equippedSlugs = new Set(userInventory.filter((i) => i.equipped).map((i) => i.item_slug));

    const shopItems = SHOP_CATALOG.map((item) => ({
      ...item,
      owned: inventorySlugs.has(item.slug),
      equipped: equippedSlugs.has(item.slug),
    }));

    return res.json({
      character: {
        ...character,
        nextLevelXp,
        xpProgressPct: Math.min(100, Math.floor((character.xp / nextLevelXp) * 100)),
      },
      streak: {
        count: streak.count,
        lastDay: streak.lastDay,
        history: historyMatrix,
      },
      attributes,
      shop: shopItems,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/stats/shop/buy — purchase item from shop
statRouter.post('/shop/buy', async (req, res, next) => {
  try {
    const { slug } = req.body ?? {};
    const item = SHOP_CATALOG.find((i) => i.slug === slug);

    if (!item) {
      return res.status(404).json({ error: 'ITEM_NOT_FOUND', message: 'Item does not exist in store.' });
    }

    const db = await getDb();
    const character = await db.get('SELECT coins FROM characters WHERE user_id = ?', [req.userId]);

    if (character.coins < item.price) {
      return res.status(400).json({ error: 'INSUFFICIENT_FUNDS', message: 'Not enough Gold Coins!' });
    }

    const existing = await db.get('SELECT id FROM inventory WHERE user_id = ? AND item_slug = ?', [req.userId, slug]);
    if (existing) {
      return res.status(400).json({ error: 'ALREADY_OWNED', message: 'You already own this item.' });
    }

    await db.run('UPDATE characters SET coins = coins - ? WHERE user_id = ?', [item.price, req.userId]);
    await db.run('INSERT INTO inventory (user_id, item_slug, equipped) VALUES (?, ?, 0)', [req.userId, slug]);

    const updatedChar = await db.get('SELECT coins FROM characters WHERE user_id = ?', [req.userId]);
    return res.json({ ok: true, newCoins: updatedChar.coins, boughtSlug: slug });
  } catch (err) {
    next(err);
  }
});

// POST /api/stats/shop/equip — toggle equip state of an owned item
statRouter.post('/shop/equip', async (req, res, next) => {
  try {
    const { slug } = req.body ?? {};
    const db = await getDb();
    const owned = await db.get('SELECT * FROM inventory WHERE user_id = ? AND item_slug = ?', [req.userId, slug]);

    if (!owned) {
      return res.status(404).json({ error: 'NOT_OWNED', message: 'You do not own this item.' });
    }

    const newEquipped = owned.equipped ? 0 : 1;
    await db.run('UPDATE inventory SET equipped = ? WHERE id = ?', [newEquipped, owned.id]);

    return res.json({ ok: true, itemSlug: slug, equipped: Boolean(newEquipped) });
  } catch (err) {
    next(err);
  }
});