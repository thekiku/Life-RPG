import bcrypt from 'bcryptjs';
import { getDb } from './db.js';
import { SHOP_CATALOG } from './engine.js';

export async function seedDb() {
  const db = await getDb();
  const hash = bcrypt.hashSync('demo1234', 12);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  await db.exec(`
    DELETE FROM inventory;
    DELETE FROM completion_log;
    DELETE FROM tasks;
    DELETE FROM characters;
    DELETE FROM users;
  `);

  const userResult = await db.run(
    'INSERT INTO users (username, password_hash, created_at, last_active_at) VALUES (?, ?, ?, ?)',
    ['hero', hash, now, now]
  );
  const userId = userResult.lastID;

  await db.run(
    `INSERT INTO characters (user_id, name, hp, max_hp, xp, level, coins, attr_int, attr_str, attr_craft, attr_spirit)
     VALUES (?, 'Valiant Dev', 100, 100, 45, 2, 280, 120, 80, 50, 90)`,
    [userId]
  );

  const sampleTasks = [
    { title: 'Read 20 pages of clean code book', description: 'Focus on refactoring patterns', attr: 'int', reward: 40, priority: 'high', status: 'active' },
    { title: '30-minute core workout session', description: 'Planks, leg raises, pushups', attr: 'str', reward: 50, priority: 'epic', status: 'active' },
    { title: 'Refactor auth middleware module', description: 'Add strict session checks', attr: 'craft', reward: 65, priority: 'high', status: 'active' },
    { title: '15-minute mindfulness breathing', description: 'Clear mind before deep work', attr: 'spirit', reward: 20, priority: 'normal', status: 'done' },
    { title: 'Drink 2L of water today', description: 'Hydration is key', attr: 'str', reward: 15, priority: 'normal', status: 'done' },
  ];

  for (const t of sampleTasks) {
    await db.run(
      `INSERT INTO tasks (user_id, title, description, attr, reward, priority, status, created_at, done_at, completed_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`,
      [userId, t.title, t.description, t.attr, t.reward, t.priority, t.status, t.status === 'done' ? now : null, t.status === 'done' ? today : null]
    );
  }

  for (const item of SHOP_CATALOG) {
    await db.run(
      `INSERT OR IGNORE INTO shop_items (slug, name, description, price, kind, accent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item.slug, item.name, item.description, item.price, item.kind, item.accent]
    );
  }

  await db.run('INSERT INTO inventory (user_id, item_slug, equipped) VALUES (?, ?, 1)', [userId, 'talisman']);

  return { message: 'Database seeded successfully!', user: 'hero', password: 'demo1234' };
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  console.log('Seeding database...');
  seedDb().then((res) => {
    console.log(res);
    process.exit(0);
  });
}