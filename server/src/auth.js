import jwt from "jsonwebtoken";
import { getDb } from "./db.js";

export const SESSION_MS = (Number(process.env.SESSION_TTL_DAYS) || 30) * 86400000;

export async function requireAuth(req, res, next) {
  const token = req.cookies?.ql_session;
  if (!token) {
    res.setHeader("WWW-Authenticate", "Cookie");
    return res.status(401).json({ error: "NOT_LOGGED_IN", message: "No active session. Sign back in, explorer." });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.SESSION_SECRET || "insecure-dev-secret");
  } catch {
    res.clearCookie("ql_session", { httpOnly: true, sameSite: "lax", path: "/" });
    return res.status(401).json({ error: "BAD_SESSION", message: "Session expired. Sign back in, explorer." });
  }

  try {
    const db = await getDb();
    const user = await db.get("SELECT id, username, created_at FROM users WHERE id = ?", [payload.sub]);
    if (!user) {
      res.clearCookie("ql_session", { httpOnly: true, sameSite: "lax", path: "/" });
      return res.status(401).json({ error: "NO_USER", message: "That adventurer no longer exists." });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    next(err);
  }
}

export function setSessionCookie(res, userId) {
  const token = jwt.sign({ sub: String(userId) }, process.env.SESSION_SECRET || "insecure-dev-secret", {
    expiresIn: `${Math.round(SESSION_MS / 1000)}s`,
    issuer: "questlog",
    audience: "questlog-client",
  });
  res.cookie("ql_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MS,
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie("ql_session", { httpOnly: true, sameSite: "lax", path: "/" });
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
  };
}
