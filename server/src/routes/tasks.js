import { Router } from "express";
import { getDb } from "../db.js";
import { applyXp, attrXpFromReward } from "../engine.js";

export const taskRouter = Router();

taskRouter.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const tasks = await db.all(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY status ASC, priority DESC, created_at DESC",
      [req.userId]
    );
    return res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

taskRouter.post("/", async (req, res, next) => {
  try {
    const { title, description = "", attr = "int", reward = 25, priority = "normal", due_date = null } = req.body ?? {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "INVALID_TITLE", message: "Quest title is required." });
    }

    const validAttr = ["int", "str", "craft", "spirit"].includes(attr) ? attr : "int";
    const validPriority = ["normal", "high", "epic"].includes(priority) ? priority : "normal";
    const rewardNum = Math.max(5, Math.min(500, Number(reward) || 25));

    const db = await getDb();
    const info = await db.run(
      `INSERT INTO tasks (user_id, title, description, attr, reward, priority, due_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
      [req.userId, title.trim().slice(0, 100), description.trim().slice(0, 500), validAttr, rewardNum, validPriority, due_date || null]
    );

    const task = await db.get("SELECT * FROM tasks WHERE id = ?", [info.lastID]);
    return res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

taskRouter.put("/:id", async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);
    const db = await getDb();
    const task = await db.get("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [taskId, req.userId]);
    if (!task) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Quest not found." });
    }

    const { title, description, attr, reward, priority, due_date } = req.body ?? {};
    const newTitle = title !== undefined ? String(title).trim().slice(0, 100) : task.title;
    const newDesc = description !== undefined ? String(description).trim().slice(0, 500) : task.description;
    const newAttr = ["int", "str", "craft", "spirit"].includes(attr) ? attr : task.attr;
    const newPriority = ["normal", "high", "epic"].includes(priority) ? priority : task.priority;
    const newReward = reward !== undefined ? Math.max(5, Math.min(500, Number(reward) || 25)) : task.reward;

    if (!newTitle) {
      return res.status(400).json({ error: "INVALID_TITLE", message: "Quest title cannot be empty." });
    }

    await db.run(
      `UPDATE tasks SET title = ?, description = ?, attr = ?, reward = ?, priority = ?, due_date = ?
       WHERE id = ? AND user_id = ?`,
      [newTitle, newDesc, newAttr, newReward, newPriority, due_date !== undefined ? due_date : task.due_date, taskId, req.userId]
    );

    const updated = await db.get("SELECT * FROM tasks WHERE id = ?", [taskId]);
    return res.json({ task: updated });
  } catch (err) {
    next(err);
  }
});

taskRouter.post("/:id/toggle", async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);
    const db = await getDb();
    const task = await db.get("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [taskId, req.userId]);
    if (!task) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Quest not found." });
    }

    const character = await db.get("SELECT * FROM characters WHERE user_id = ?", [req.userId]);
    if (!character) {
      return res.status(500).json({ error: "NO_CHARACTER", message: "Character record missing." });
    }

    const now = new Date().toISOString();
    const todayDate = now.slice(0, 10);
    const newStatus = task.status === "active" ? "done" : "active";

    let xpDelta = newStatus === "done" ? task.reward : -task.reward;
    let coinDelta = newStatus === "done" ? Math.floor(task.reward / 2) : -Math.floor(task.reward / 2);

    await db.run("UPDATE tasks SET status = ?, done_at = ?, completed_on = ? WHERE id = ?", [
      newStatus,
      newStatus === "done" ? now : null,
      newStatus === "done" ? todayDate : null,
      taskId,
    ]);

    if (newStatus === "done") {
      await db.run(
        "INSERT INTO completion_log (user_id, task_id, title, attr, reward, completed_on) VALUES (?, ?, ?, ?, ?, ?)",
        [req.userId, taskId, task.title, task.attr, task.reward, todayDate]
      );
    } else {
      await db.run("DELETE FROM completion_log WHERE task_id = ? AND user_id = ?", [taskId, req.userId]);
    }

    let newXp = character.xp + xpDelta;
    let newLevel = character.level;
    let newCoins = Math.max(0, character.coins + coinDelta);
    let leveledUp = false;

    if (newStatus === "done") {
      const applyResult = applyXp(character, xpDelta);
      newXp = applyResult.xp;
      newLevel = applyResult.level;
      if (applyResult.leveledUpTo !== null) leveledUp = true;
    } else {
      if (newXp < 0) newXp = 0;
    }

    const attrCol = `attr_${task.attr}`;
    const attrDelta = newStatus === "done" ? attrXpFromReward(task.reward) : -attrXpFromReward(task.reward);
    const newAttrVal = Math.max(0, (character[attrCol] || 0) + attrDelta);

    await db.run(
      `UPDATE characters SET xp = ?, level = ?, coins = ?, ${attrCol} = ? WHERE user_id = ?`,
      [newXp, newLevel, newCoins, newAttrVal, req.userId]
    );

    const updatedTask = await db.get("SELECT * FROM tasks WHERE id = ?", [taskId]);
    const updatedChar = await db.get("SELECT * FROM characters WHERE user_id = ?", [req.userId]);

    return res.json({ task: updatedTask, character: updatedChar, leveledUp, xpGained: xpDelta, coinsGained: coinDelta });
  } catch (err) {
    next(err);
  }
});

taskRouter.delete("/:id", async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);
    const db = await getDb();
    const info = await db.run("DELETE FROM tasks WHERE id = ? AND user_id = ?", [taskId, req.userId]);
    if (info.changes === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Quest not found." });
    }
    return res.json({ ok: true, deletedId: taskId });
  } catch (err) {
    next(err);
  }
});
