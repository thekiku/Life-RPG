export type Attribute = "intellect" | "strength" | "discipline" | "creativity";

export function xpForLevel(level: number) {
  return Math.floor(100 * Math.pow(level, 1.45));
}

export function levelFromXp(totalXp: number) {
  let level = 1;
  let spent = 0;
  while (totalXp >= spent + xpForLevel(level)) {
    spent += xpForLevel(level);
    level++;
  }
  return { level, current: totalXp - spent, needed: xpForLevel(level) };
}

export function rewardForDifficulty(difficulty: "easy" | "medium" | "hard") {
  if (difficulty === "easy") return { xp: 25, gold: 10 };
  if (difficulty === "medium") return { xp: 60, gold: 25 };
  return { xp: 120, gold: 50 };
}
