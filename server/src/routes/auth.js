import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db.js";
import { setSessionCookie, clearSessionCookie, publicUser } from "../auth.js";

export const authRouter = Router();

const MAX_PASSWORD = 128;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function validUsername(u) {
  return typeof u === "string" && USERNAME_RE.test(u);
}
function validPassword(p) {
  return typeof p === "string" && p.length >= 8 && p.length <= MAX_PASSWORD;
}

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { username, password, characterName } = req.body ?? {};

    if (!validUsername(username)) {
      return res.status(400).json({ error: "BAD_USERNAME", message: "Username must be 3-20 letters, numbers or underscores." });
    }
    if (!validPassword(password)) {
      return res.status(400).json({ error: "BAD_PASSWORD", message: "Password needs at least 8 characters (max 128)." });
    }
    const cname = typeof characterName === "string" && characterName.trim().length
      ? characterName.trim().slice(0, 20)
      : username;

    const db = await getDb();
    const existing = await db.get("SELECT id FROM users WHERE username = ?", [username]);
    if (existing) {
      return res.status(409).json({ error: "USERNAME_TAKEN", message: "That name is already on the board." });
    }

    const hash = bcrypt.hashSync(password, 12);
    const now = new Date().toISOString();

    const info = await db.run(
      "INSERT INTO users (username, password_hash, created_at, last_active_at) VALUES (?,?,?,?)",
      [username, hash, now, now]
    );
    const userId = info.lastID;

    await db.run(
      `INSERT INTO characters (user_id, name, hp, max_hp, xp, level, coins, attr_int, attr_str, attr_craft, attr_spirit)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, cname, 100, 100, 0, 1, 0, 0, 0, 0, 0]
    );

    setSessionCookie(res, userId);
    return res.status(201).json({ user: { id: userId, username, createdAt: now, characterName: cname } });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Send both a username and password." });
    }

    const db = await getDb();
    const user = await db.get("SELECT * FROM users WHERE username = ?", [String(username)]);
    const ok = user && bcrypt.compareSync(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "BAD_CREDENTIALS", message: "Wrong name or wrong runes. Try again." });
    }

    await db.run("UPDATE users SET last_active_at = ? WHERE id = ?", [new Date().toISOString(), user.id]);
    setSessionCookie(res, user.id);
    return res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.ql_session;
  if (!token) return res.json({ user: null });

  try {
    const payload = jwt.verify(token, process.env.SESSION_SECRET || "insecure-dev-secret");
    const db = await getDb();
    const user = await db.get("SELECT id, username, created_at FROM users WHERE id = ?", [payload.sub]);
    if (!user) return res.json({ user: null });
    return res.json({ user: publicUser(user) });
  } catch {
    return res.json({ user: null });
  }
});
