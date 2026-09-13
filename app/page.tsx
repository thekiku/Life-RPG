"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { levelFromXp, rewardForDifficulty, type Attribute } from "../lib/game";
import {
  Activity,
  BarChart3,
  Boxes,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  Crown,
  Dumbbell,
  Flame,
  Gem,
  Hexagon,
  History,
  LogOut,
  Menu,
  Palette,
  Plus,
  Radio,
  Save,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Sword,
  Target,
  Trash2,
  Trophy,
  UserRound,
  Users,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard";
  attribute: Attribute;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  total_xp: number;
  gold: number;
  streak: number;
  intellect: number;
  strength: number;
  discipline: number;
  creativity: number;
  last_active_date: string | null;
  created_at?: string;
};

type ActivityRow = {
  id: string;
  task_id: string | null;
  xp_earned: number;
  gold_earned: number;
  attribute: string | null;
  created_at: string;
};

type PlayerState = {
  user_id: string;
  xp_boost_uses: number;
  gold_boost_uses: number;
  streak_shields: number;
  boss_bonus_damage: number;
  boss_week: string | null;
  boss_claimed_week: string | null;
  raid_claim_date: string | null;
  equipped_theme: string;
  sound_enabled: boolean;
};

type View = "quests" | "focus" | "skills" | "bazaar" | "raids" | "telemetry" | "profile";
type Filter = "active" | "cleared" | "all";
type SortMode = "high" | "newest" | "reward";
type ShopTab = "boosts" | "relics" | "themes";

type StoreItem = {
  key: string;
  name: string;
  desc: string;
  price: number;
  kind: "boost" | "relic" | "theme" | "tome" | "crate";
  glyph: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  accent: "cyan" | "gold" | "violet" | "green" | "red";
  attribute?: Attribute;
  theme?: string;
};

const attributeIcons = {
  intellect: Brain,
  strength: Dumbbell,
  discipline: ShieldCheck,
  creativity: Palette,
};

const starterState: Omit<PlayerState, "user_id"> = {
  xp_boost_uses: 0,
  gold_boost_uses: 0,
  streak_shields: 0,
  boss_bonus_damage: 0,
  boss_week: null,
  boss_claimed_week: null,
  raid_claim_date: null,
  equipped_theme: "farmstead",
  sound_enabled: true,
};


type ThemeBoss = {
  label: string;
  threat: string;
  name: string;
  defeatedName: string;
  description: string;
  glyph: string;
  targetLabel: string;
  hpLabel: string;
  rewardToken: string;
  strikeLabel: string;
  defeatedLabel: string;
};

const themeBosses: Record<string, ThemeBoss> = {
  farmstead: {
    label: "FARMSTEAD BOUNTY BOSS",
    threat: "HARVEST THREAT: DIRE",
    name: "THE BLIGHTROOT SCARECROW",
    defeatedName: "THE BLIGHTROOT HAS WITHERED",
    description: "A cursed field guardian that grows stronger on abandoned plans and unfinished chores.",
    glyph: "🌾",
    targetLabel: "[BOUNTY POSTED] // EAST FIELD",
    hpLabel: "BLIGHT VITALITY",
    rewardToken: "HARVEST HEART",
    strikeLabel: "SWING THE HARVEST BLADE",
    defeatedLabel: "FIELD RESTORED",
  },
  retro: {
    label: "ARCADE RAID BOSS",
    threat: "ERROR LEVEL: 99",
    name: "GLITCH KING 404",
    defeatedName: "GLITCH KING // DELETED",
    description: "A corrupted arcade tyrant spawning lag, distractions and infinite side quests.",
    glyph: "👾",
    targetLabel: "[PLAYER 1 READY] // FINAL STAGE",
    hpLabel: "BOSS ENERGY",
    rewardToken: "GLITCH CHIP",
    strikeLabel: "INSERT COIN // ATTACK",
    defeatedLabel: "STAGE CLEAR",
  },
  void: {
    label: "WORLD CALAMITY BOSS",
    threat: "THREAT LEVEL: EXTREME",
    name: "THE PROCRASTINATION BEHEMOTH",
    defeatedName: "THE BEHEMOTH HAS FALLEN",
    description: "Apex Chrono-Parasite feeding on unfulfilled intentions and deferred tasks.",
    glyph: "◈",
    targetLabel: "[LOCK ON] // CALAMITY TARGET",
    hpLabel: "NEMESIS INTEGRITY",
    rewardToken: "CHRONO CORE",
    strikeLabel: "EXECUTE BOSS STRIKE",
    defeatedLabel: "NEMESIS NEUTRALIZED",
  },
  solar: {
    label: "SOLAR FORGE TITAN",
    threat: "CORE HEAT: CRITICAL",
    name: "THE HELIOCORE DEVOURER",
    defeatedName: "THE DEVOURER HAS COOLED",
    description: "A star-forged colossus that burns through focus and turns momentum into ash.",
    glyph: "☀️",
    targetLabel: "[FORGE LOCK] // SOLAR TITAN",
    hpLabel: "CORE STABILITY",
    rewardToken: "SUNFORGE CORE",
    strikeLabel: "OVERCHARGE SOLAR STRIKE",
    defeatedLabel: "CORE STABILIZED",
  },
  arctic: {
    label: "ARCTIC ANOMALY BOSS",
    threat: "WHITEOUT LEVEL: OMEGA",
    name: "THE FROSTFANG COLOSSUS",
    defeatedName: "THE COLOSSUS HAS SHATTERED",
    description: "An ancient ice titan that freezes routines, slows streaks and buries goals beneath snow.",
    glyph: "❄️",
    targetLabel: "[THERMAL LOCK] // ICE TITAN",
    hpLabel: "FROST ARMOR",
    rewardToken: "AURORA SHARD",
    strikeLabel: "BREAK THE ICE",
    defeatedLabel: "WHITEOUT CLEARED",
  },
  crimson: {
    label: "CRIMSON WAR BOSS",
    threat: "RAGE INDEX: MAXIMUM",
    name: "THE BLOODFORGE WARLORD",
    defeatedName: "THE WARLORD IS BROKEN",
    description: "A relentless commander forged from burnout, chaos and every task left to become urgent.",
    glyph: "🔥",
    targetLabel: "[DUEL MARKED] // WARLORD",
    hpLabel: "WARLORD VITALITY",
    rewardToken: "CRIMSON SIGIL",
    strikeLabel: "UNLEASH CRIMSON STRIKE",
    defeatedLabel: "WARLORD DEFEATED",
  },
};

const storeItems: StoreItem[] = [
  { key: "theme_void", name: "Void Protocol", desc: "Return to the original dark command theme.", price: 0, kind: "theme", glyph: "◌", rarity: "COMMON", accent: "violet", theme: "void" },
  { key: "theme_retro", name: "Retro Terminal", desc: "FREE theme: pixel-style CRT terminal interface with scanlines and arcade-era styling.", price: 0, kind: "theme", glyph: "▦", rarity: "COMMON", accent: "green", theme: "retro" },
  { key: "theme_farmstead", name: "Cozy Farmstead", desc: "FREE theme: cozy pixel-farm RPG styling with warm wood, parchment panels, grass greens, seasonal accents, and chunky game-like controls.", price: 0, kind: "theme", glyph: "🌱", rarity: "COMMON", accent: "green", theme: "farmstead" },
  { key: "xp_elixir", name: "XP Elixir", desc: "+50% XP on your next 3 completed quests.", price: 120, kind: "boost", glyph: "⚡", rarity: "RARE", accent: "cyan" },
  { key: "gold_magnet", name: "Gold Magnet", desc: "+50% Gold on your next 3 completed quests.", price: 120, kind: "boost", glyph: "◉", rarity: "RARE", accent: "gold" },
  { key: "streak_aegis", name: "Streak Aegis", desc: "Protect one missed day without losing your streak.", price: 180, kind: "boost", glyph: "⬡", rarity: "EPIC", accent: "green" },
  { key: "boss_strike", name: "Boss Strike", desc: "Deal 20% direct damage to this week's Nemesis.", price: 150, kind: "boost", glyph: "✦", rarity: "COMMON", accent: "red" },
  { key: "mystery_crate", name: "Mystery Crate", desc: "Open a random cosmetic relic or receive a gold cache.", price: 250, kind: "crate", glyph: "▣", rarity: "LEGENDARY", accent: "violet" },
  { key: "mind_tome", name: "Tome of Mind", desc: "+3 Intellect permanently.", price: 320, kind: "tome", glyph: "◈", rarity: "EPIC", accent: "cyan", attribute: "intellect" },
  { key: "might_tome", name: "Tome of Might", desc: "+3 Strength permanently.", price: 320, kind: "tome", glyph: "◆", rarity: "EPIC", accent: "red", attribute: "strength" },
  { key: "will_tome", name: "Tome of Will", desc: "+3 Discipline permanently.", price: 320, kind: "tome", glyph: "⬢", rarity: "EPIC", accent: "green", attribute: "discipline" },
  { key: "creation_tome", name: "Tome of Creation", desc: "+3 Creativity permanently.", price: 320, kind: "tome", glyph: "✺", rarity: "EPIC", accent: "violet", attribute: "creativity" },
  { key: "chrono_pocket", name: "Chronos Pocket", desc: "Rare permanent relic for the Vault.", price: 400, kind: "relic", glyph: "⌛", rarity: "RARE", accent: "gold" },
  { key: "void_crest", name: "Void Crest", desc: "Epic profile relic forged in the Void.", price: 550, kind: "relic", glyph: "✦", rarity: "EPIC", accent: "violet" },
  { key: "hunter_sigil", name: "Hunter Sigil", desc: "Legendary Nemesis hunter insignia.", price: 800, kind: "relic", glyph: "⌁", rarity: "LEGENDARY", accent: "gold" },
  { key: "theme_solar", name: "Solar Forge", desc: "Gold and ember interface theme.", price: 1000, kind: "theme", glyph: "☀", rarity: "LEGENDARY", accent: "gold", theme: "solar" },
  { key: "theme_arctic", name: "Arctic Pulse", desc: "Ice-blue holographic interface theme.", price: 1000, kind: "theme", glyph: "❄", rarity: "LEGENDARY", accent: "cyan", theme: "arctic" },
  { key: "theme_crimson", name: "Crimson Core", desc: "Aggressive red combat interface theme.", price: 1200, kind: "theme", glyph: "◒", rarity: "LEGENDARY", accent: "red", theme: "crimson" },
];

const crateRelics = [
  { key: "crate_nebula", label: "Nebula Crest" },
  { key: "crate_phantom", label: "Phantom Banner" },
  { key: "crate_glitch", label: "Glitch Crown" },
  { key: "crate_aurora", label: "Aurora Trail" },
];

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayDifference(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = new Date(ay, am - 1, ad);
  const db = new Date(by, bm - 1, bd);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekStart() {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - day + 1);
  return start;
}

function isToday(iso: string | null) {
  if (!iso) return false;
  return localDateString(new Date(iso)) === localDateString();
}

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const audioCtx = useRef<AudioContext | null>(null);
  const ambientOsc = useRef<OscillatorNode | null>(null);
  const ambientGain = useRef<GainNode | null>(null);
  const questInput = useRef<HTMLInputElement | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [owned, setOwned] = useState<string[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authMessage, setAuthMessage] = useState("");

  const [view, setView] = useState<View>("quests");
  const [mobileNav, setMobileNav] = useState(false);
  const [filter, setFilter] = useState<Filter>("active");
  const [sortMode, setSortMode] = useState<SortMode>("high");
  const [shopTab, setShopTab] = useState<ShopTab>("boosts");

  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [attribute, setAttribute] = useState<Attribute>("intellect");
  const [displayName, setDisplayName] = useState("");

  const [toast, setToast] = useState("");
  const [clock, setClock] = useState("00:00:00");
  const [particles, setParticles] = useState<number[]>([]);
  const [xpFloat, setXpFloat] = useState<string | null>(null);
  const [goldFloat, setGoldFloat] = useState<string | null>(null);
  const [levelOverlay, setLevelOverlay] = useState<number | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [bossHit, setBossHit] = useState(false);
  const [hudPulse, setHudPulse] = useState(false);

  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "short" | "long">("focus");
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);

  const pomodoroDurations = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  } as const;
  const pomodoroDuration = pomodoroDurations[pomodoroMode];
  const pomodoroProgress = Math.min(
    100,
    Math.max(0, ((pomodoroDuration - pomodoroSeconds) / pomodoroDuration) * 100)
  );
  const pomodoroDisplay = `${String(Math.floor(pomodoroSeconds / 60)).padStart(2, "0")}:${String(
    pomodoroSeconds % 60
  ).padStart(2, "0")}`;

  const currentWeek = weekKey();
  const level = profile ? levelFromXp(profile.total_xp) : { level: 1, current: 0, needed: 100 };
  const xpPct = Math.min(100, Math.round((level.current / level.needed) * 100));
  const activeTasks = tasks.filter(task => !task.completed);
  const clearedTasks = tasks.filter(task => task.completed);
  const completedThisWeek = tasks.filter(task => task.completed && task.completed_at && new Date(task.completed_at) >= weekStart()).length;
  const bonusDamage = state?.boss_week === currentWeek ? state.boss_bonus_damage : 0;
  const bossDamage = Math.min(100, completedThisWeek * 20 + bonusDamage);
  const bossHp = 100 - bossDamage;
  const bossClaimed = state?.boss_claimed_week === currentWeek;
  const currentTheme = state?.equipped_theme ?? "farmstead";
  const currentBoss = themeBosses[currentTheme] ?? themeBosses.void;
  const todayClears = tasks.filter(task => task.completed && isToday(task.completed_at)).length;
  const raidReady = todayClears >= 3;
  const raidClaimed = state?.raid_claim_date === localDateString();

  const filteredTasks = (filter === "active" ? activeTasks : filter === "cleared" ? clearedTasks : tasks).slice();
  filteredTasks.sort((a, b) => {
    if (sortMode === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    const difficultyScore = { easy: 1, medium: 2, hard: 3 };
    if (sortMode === "high") return difficultyScore[b.difficulty] - difficultyScore[a.difficulty];
    return rewardForDifficulty(b.difficulty).xp - rewardForDifficulty(a.difficulty).xp;
  });

  const sevenDayActivity = activity.filter(row => Date.now() - new Date(row.created_at).getTime() <= 7 * 86400000);
  const weeklyXp = sevenDayActivity.reduce((sum, row) => sum + row.xp_earned, 0);
  const weeklyGold = sevenDayActivity.reduce((sum, row) => sum + row.gold_earned, 0);
  const weeklyCompletions = sevenDayActivity.length;

  useEffect(() => {
    const id = window.setInterval(() => {
      const d = new Date();
      setClock([d.getHours(), d.getMinutes(), d.getSeconds()].map(value => String(value).padStart(2, "0")).join(":"));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pomodoroRunning) return;

    const id = window.setInterval(() => {
      setPomodoroSeconds(previous => {
        if (previous <= 1) {
          setPomodoroRunning(false);

          if (pomodoroMode === "focus") {
            setPomodoroSessions(count => count + 1);
            setToast("FOCUS QUEST COMPLETE // TAKE A BREAK");
          } else {
            setToast("BREAK COMPLETE // READY TO ASCEND");
          }

          window.setTimeout(() => setToast(""), 2600);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [pomodoroRunning, pomodoroMode]);

  useEffect(() => {
    document.documentElement.dataset.theme = state?.equipped_theme ?? "farmstead";
  }, [state?.equipped_theme]);

  function changePomodoroMode(mode: "focus" | "short" | "long") {
    setPomodoroRunning(false);
    setPomodoroMode(mode);
    setPomodoroSeconds(pomodoroDurations[mode]);
    playSound("click");
  }

  function resetPomodoro() {
    setPomodoroRunning(false);
    setPomodoroSeconds(pomodoroDurations[pomodoroMode]);
    playSound("click");
  }

  function togglePomodoro() {
    if (pomodoroSeconds === 0) {
      setPomodoroSeconds(pomodoroDurations[pomodoroMode]);
    }
    setPomodoroRunning(value => !value);
    playSound("click");
  }

  function getAudioContext() {
    if (typeof window === "undefined") return null;
    const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return null;
    if (!audioCtx.current) audioCtx.current = new Context();
    return audioCtx.current;
  }

  function playSound(kind: "hover" | "click" | "quest" | "level" | "boss" | "buy" | "error" | "raid", force = false) {
    if (!force && !state?.sound_enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const tone = (frequency: number, delay: number, duration: number, type: OscillatorType, gain = 0.035) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + delay + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
      osc.connect(g).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.03);
    };

    if (kind === "hover") tone(760, 0, 0.035, "square", 0.008);
    if (kind === "click") { tone(310, 0, 0.05, "square", 0.017); tone(510, 0.025, 0.05, "square", 0.012); }
    if (kind === "quest") { tone(392, 0, 0.12, "triangle", 0.045); tone(587, 0.08, 0.14, "triangle", 0.05); tone(880, 0.17, 0.22, "sine", 0.055); }
    if (kind === "level") { tone(523, 0, 0.14, "triangle", 0.05); tone(659, 0.12, 0.14, "triangle", 0.055); tone(784, 0.24, 0.15, "triangle", 0.06); tone(1046, 0.36, 0.28, "sine", 0.065); }
    if (kind === "boss") { tone(110, 0, 0.22, "sawtooth", 0.055); tone(82, 0.07, 0.3, "square", 0.045); tone(220, 0.2, 0.18, "sawtooth", 0.04); }
    if (kind === "buy") { tone(660, 0, 0.08, "sine", 0.035); tone(990, 0.08, 0.15, "sine", 0.05); }
    if (kind === "error") { tone(170, 0, 0.11, "sawtooth", 0.03); tone(125, 0.08, 0.16, "sawtooth", 0.025); }
    if (kind === "raid") { tone(220, 0, 0.1, "square", 0.03); tone(440, 0.08, 0.12, "square", 0.04); tone(880, 0.18, 0.2, "triangle", 0.05); }
  }

  function startAmbient(force = false) {
    if (!force && !state?.sound_enabled) return;
    const ctx = getAudioContext();
    if (!ctx || ambientOsc.current) return;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = 52;
    filterNode.type = "lowpass";
    filterNode.frequency.value = 145;
    gain.gain.value = 0.01;
    osc.connect(filterNode).connect(gain).connect(ctx.destination);
    osc.start();
    ambientOsc.current = osc;
    ambientGain.current = gain;
  }

  function stopAmbient() {
    try { ambientOsc.current?.stop(); } catch { /* noop */ }
    ambientOsc.current = null;
    ambientGain.current = null;
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function triggerParticles() {
    setParticles(Array.from({ length: 36 }, (_, i) => Date.now() + i));
    window.setTimeout(() => setParticles([]), 900);
  }

  function triggerImpact() {
    setScreenShake(true);
    setBossHit(true);
    triggerParticles();
    window.setTimeout(() => setScreenShake(false), 420);
    window.setTimeout(() => setBossHit(false), 650);
  }

  async function ensurePlayerState(userId: string) {
    let { data } = await supabase.from("player_state").select("*").eq("user_id", userId).single();
    if (!data) {
      const inserted = await supabase.from("player_state").insert({ user_id: userId, ...starterState });
      if (!inserted.error) data = (await supabase.from("player_state").select("*").eq("user_id", userId).single()).data;
    }
    if (!data) data = { user_id: userId, ...starterState };

    if (data && data.boss_week !== currentWeek) {
      await supabase.from("player_state").update({ boss_week: currentWeek, boss_bonus_damage: 0 }).eq("user_id", userId);
      data = { ...data, boss_week: currentWeek, boss_bonus_damage: 0 };
    }
    return data as PlayerState;
  }

  async function loadData(userId: string) {
    let { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!p) {
      await supabase.from("profiles").insert({ id: userId, display_name: "Adventurer" });
      p = (await supabase.from("profiles").select("*").eq("id", userId).single()).data;
    }

    const [taskResult, activityResult, inventoryResult, playerState] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("activity_log").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("inventory").select("item_key").eq("user_id", userId),
      ensurePlayerState(userId),
    ]);

    setProfile(p);
    setDisplayName(p?.display_name ?? "Adventurer");
    setTasks(taskResult.data ?? []);
    setActivity(activityResult.data ?? []);
    setOwned((inventoryResult.data ?? []).map((item: { item_key: string }) => item.item_key));
    setState(playerState);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUid(data.user.id);
        void loadData(data.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      setUid(id);
      if (id) void loadData(id);
      else {
        stopAmbient();
        setProfile(null);
        setState(null);
        setTasks([]);
        setActivity([]);
        setOwned([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();
    setAuthMessage("");
    if (!email || !password) return setAuthMessage("Enter both email and password.");
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setAuthMessage(result.error.message);
    else setAuthMessage(authMode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Welcome back.");
  }

  async function addQuest(event: React.FormEvent) {
    event.preventDefault();
    if (!uid || !title.trim()) return;
    startAmbient();
    playSound("click");
    const { data, error } = await supabase.from("tasks").insert({
      user_id: uid,
      title: title.trim(),
      difficulty,
      attribute,
    }).select().single();
    if (error) {
      playSound("error");
      notify(error.message);
      return;
    }
    setTasks(prev => [data, ...prev]);
    setTitle("");
    notify("DIRECTIVE ACCEPTED // MISSION LOCKED");
  }

  async function claimBossReward(baseGold: number, nextState: PlayerState) {
    if (!profile || nextState.boss_claimed_week === currentWeek) return { gold: baseGold, state: nextState };
    const reward = 300;
    const gold = baseGold + reward;
    const updatedState = { ...nextState, boss_claimed_week: currentWeek };
    await Promise.all([
      supabase.from("profiles").update({ gold }).eq("id", profile.id),
      supabase.from("player_state").update({ boss_claimed_week: currentWeek }).eq("user_id", profile.id),
    ]);
    playSound("boss");
    triggerImpact();
    notify(`NEMESIS DEFEATED // +${reward} BOSS GOLD`);
    return { gold, state: updatedState };
  }

  async function completeQuest(task: Task) {
    if (!profile || !state || task.completed) return;
    startAmbient();
    const oldLevel = level.level;
    const baseReward = rewardForDifficulty(task.difficulty);
    const xp = Math.round(baseReward.xp * (state.xp_boost_uses > 0 ? 1.5 : 1));
    const goldEarned = Math.round(baseReward.gold * (state.gold_boost_uses > 0 ? 1.5 : 1));
    const today = localDateString();
    let streak = profile.streak;
    let shields = state.streak_shields;

    if (!profile.last_active_date) streak = 1;
    else {
      const diff = dayDifference(profile.last_active_date, today);
      if (diff === 1) streak += 1;
      else if (diff === 2 && shields > 0) {
        shields -= 1;
        streak += 1;
        notify("STREAK AEGIS ACTIVATED // COMBO SAVED");
      } else if (diff > 1) streak = 1;
    }

    const nextProfile: Profile = {
      ...profile,
      total_xp: profile.total_xp + xp,
      gold: profile.gold + goldEarned,
      streak,
      last_active_date: today,
      [task.attribute]: profile[task.attribute] + 1,
    };
    let nextState: PlayerState = {
      ...state,
      xp_boost_uses: Math.max(0, state.xp_boost_uses - (state.xp_boost_uses > 0 ? 1 : 0)),
      gold_boost_uses: Math.max(0, state.gold_boost_uses - (state.gold_boost_uses > 0 ? 1 : 0)),
      streak_shields: shields,
    };

    const completedAt = new Date().toISOString();
    setTasks(prev => prev.map(item => item.id === task.id ? { ...item, completed: true, completed_at: completedAt } : item));
    setProfile(nextProfile);
    setState(nextState);
    setXpFloat(`+${xp} XP`);
    setGoldFloat(`+${goldEarned} G`);
    setHudPulse(true);
    triggerImpact();
    playSound("quest");
    window.setTimeout(() => { setXpFloat(null); setGoldFloat(null); }, 1200);
    window.setTimeout(() => setHudPulse(false), 750);

    const activityInsert = {
      user_id: profile.id,
      task_id: task.id,
      xp_earned: xp,
      gold_earned: goldEarned,
      attribute: task.attribute,
    };

    await Promise.all([
      supabase.from("tasks").update({ completed: true, completed_at: completedAt }).eq("id", task.id),
      supabase.from("profiles").update({
        total_xp: nextProfile.total_xp,
        gold: nextProfile.gold,
        streak: nextProfile.streak,
        last_active_date: nextProfile.last_active_date,
        [task.attribute]: nextProfile[task.attribute],
      }).eq("id", profile.id),
      supabase.from("player_state").update({
        xp_boost_uses: nextState.xp_boost_uses,
        gold_boost_uses: nextState.gold_boost_uses,
        streak_shields: nextState.streak_shields,
      }).eq("user_id", profile.id),
      supabase.from("activity_log").insert(activityInsert),
    ]);

    setActivity(prev => [{ id: `local-${Date.now()}`, created_at: completedAt, ...activityInsert }, ...prev]);

    const projectedDamage = Math.min(100, (completedThisWeek + 1) * 20 + bonusDamage);
    if (projectedDamage >= 100 && !bossClaimed) {
      const claimed = await claimBossReward(nextProfile.gold, nextState);
      nextProfile.gold = claimed.gold;
      nextState = claimed.state;
      setProfile({ ...nextProfile });
      setState({ ...nextState });
    } else {
      notify(`VANQUISHED // +${xp} XP // +${goldEarned} GOLD`);
    }

    const newLevel = levelFromXp(nextProfile.total_xp).level;
    if (newLevel > oldLevel) {
      setLevelOverlay(newLevel);
      playSound("level");
      window.setTimeout(() => setLevelOverlay(null), 2400);
    }
  }

  async function deleteQuest(id: string) {
    playSound("click");
    setTasks(prev => prev.filter(task => task.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
    notify("DIRECTIVE PURGED");
  }

  async function spendGold(cost: number) {
    if (!profile) return false;
    if (profile.gold < cost) {
      playSound("error");
      notify("INSUFFICIENT GOLD // VANQUISH MORE DIRECTIVES");
      return false;
    }
    const gold = profile.gold - cost;
    setProfile({ ...profile, gold });
    await supabase.from("profiles").update({ gold }).eq("id", profile.id);
    return true;
  }

  async function executeBossStrike() {
    if (!profile || !state) return;
    startAmbient();
    if (!(await spendGold(150))) return;
    const nextBonus = Math.min(100, bonusDamage + 20);
    let nextState: PlayerState = { ...state, boss_week: currentWeek, boss_bonus_damage: nextBonus };
    await supabase.from("player_state").update({ boss_week: currentWeek, boss_bonus_damage: nextBonus }).eq("user_id", profile.id);
    setState(nextState);
    playSound("boss");
    triggerImpact();

    const projected = Math.min(100, completedThisWeek * 20 + nextBonus);
    const currentGold = profile.gold - 150;
    if (projected >= 100 && !bossClaimed) {
      const claimed = await claimBossReward(currentGold, nextState);
      setProfile(prev => prev ? { ...prev, gold: claimed.gold } : prev);
      setState(claimed.state);
    } else notify("BOSS STRIKE EXECUTED // -20% ARMOR");
  }

  async function buyStoreItem(item: StoreItem) {
    if (!profile || !state) return;
    startAmbient();
    playSound("click");

    if (item.kind === "boost") {
      if (item.key === "boss_strike") return executeBossStrike();
      if (!(await spendGold(item.price))) return;
      if (item.key === "xp_elixir") {
        const uses = state.xp_boost_uses + 3;
        await supabase.from("player_state").update({ xp_boost_uses: uses }).eq("user_id", profile.id);
        setState({ ...state, xp_boost_uses: uses });
      }
      if (item.key === "gold_magnet") {
        const uses = state.gold_boost_uses + 3;
        await supabase.from("player_state").update({ gold_boost_uses: uses }).eq("user_id", profile.id);
        setState({ ...state, gold_boost_uses: uses });
      }
      if (item.key === "streak_aegis") {
        const shields = state.streak_shields + 1;
        await supabase.from("player_state").update({ streak_shields: shields }).eq("user_id", profile.id);
        setState({ ...state, streak_shields: shields });
      }
      playSound("buy");
      notify(`${item.name.toUpperCase()} // ACTIVATED`);
      return;
    }

    if (item.kind === "crate") {
      if (!(await spendGold(item.price))) return;
      const available = crateRelics.filter(relic => !owned.includes(relic.key));
      if (available.length) {
        const relic = available[Math.floor(Math.random() * available.length)];
        await supabase.from("inventory").insert({ user_id: profile.id, item_key: relic.key });
        setOwned(prev => [...prev, relic.key]);
        notify(`CRATE OPENED // ${relic.label.toUpperCase()} FOUND`);
      } else {
        const refund = 150;
        const gold = profile.gold - item.price + refund;
        await supabase.from("profiles").update({ gold }).eq("id", profile.id);
        setProfile({ ...profile, gold });
        notify(`CRATE CACHE // +${refund} GOLD`);
      }
      playSound("buy");
      return;
    }

    if (item.kind === "tome" && item.attribute) {
      if (!(await spendGold(item.price))) return;
      const nextValue = profile[item.attribute] + 3;
      await supabase.from("profiles").update({ [item.attribute]: nextValue }).eq("id", profile.id);
      setProfile(prev => prev ? { ...prev, [item.attribute!]: nextValue } : prev);
      playSound("buy");
      notify(`${item.name.toUpperCase()} // +3 ${item.attribute.toUpperCase()}`);
      return;
    }

    if (item.kind === "relic") {
      if (owned.includes(item.key)) return notify("RELIC ALREADY OWNED");
      if (!(await spendGold(item.price))) return;
      const { error } = await supabase.from("inventory").insert({ user_id: profile.id, item_key: item.key });
      if (error) return notify(error.message);
      setOwned(prev => [...prev, item.key]);
      playSound("buy");
      notify(`${item.name.toUpperCase()} // VAULTED`);
      return;
    }

    if (item.kind === "theme" && item.theme) {
      if (!owned.includes(item.key)) {
        if (!(await spendGold(item.price))) return;
        const { error } = await supabase.from("inventory").insert({ user_id: profile.id, item_key: item.key });
        if (error) return notify(error.message);
        setOwned(prev => [...prev, item.key]);
      }
      await supabase.from("player_state").update({ equipped_theme: item.theme }).eq("user_id", profile.id);
      setState({ ...state, equipped_theme: item.theme });
      playSound("buy");
      notify(`${item.name.toUpperCase()} // THEME EQUIPPED`);
    }
  }

  async function claimRaid() {
    if (!profile || !state) return;
    if (!raidReady) return notify("RAID LOCKED // COMPLETE 3 QUESTS TODAY");
    if (raidClaimed) return notify("RAID CACHE ALREADY CLAIMED TODAY");
    const reward = 75;
    const gold = profile.gold + reward;
    const date = localDateString();
    await Promise.all([
      supabase.from("profiles").update({ gold }).eq("id", profile.id),
      supabase.from("player_state").update({ raid_claim_date: date }).eq("user_id", profile.id),
    ]);
    setProfile({ ...profile, gold });
    setState({ ...state, raid_claim_date: date });
    playSound("raid");
    triggerParticles();
    notify(`RAID CLEARED // +${reward} GOLD`);
  }

  async function toggleSound() {
    if (!profile || !state) return;
    const enabled = !state.sound_enabled;
    setState({ ...state, sound_enabled: enabled });
    await supabase.from("player_state").update({ sound_enabled: enabled }).eq("user_id", profile.id);
    if (!enabled) stopAmbient();
    else {
      window.setTimeout(() => startAmbient(true), 10);
      window.setTimeout(() => playSound("click", true), 20);
    }
  }

  async function saveProfile() {
    if (!profile || !displayName.trim()) return;
    const name = displayName.trim().slice(0, 40);
    await supabase.from("profiles").update({ display_name: name }).eq("id", profile.id);
    setProfile({ ...profile, display_name: name });
    playSound("click");
    notify("NEURAL IDENTITY UPDATED");
  }

  function navigate(next: View) {
    startAmbient();
    playSound("click");
    setView(next);
    setMobileNav(false);
  }

  function quickForge(targetAttribute?: Attribute) {
    if (targetAttribute) setAttribute(targetAttribute);
    navigate("quests");
    window.setTimeout(() => questInput.current?.focus(), 120);
  }

  if (!uid) {
    return (
      <main className="auth-page farm-login" onClick={startAmbient}>
        <div className="farm-sky" aria-hidden="true">
          <div className="farm-sun" />
          <div className="farm-cloud farm-cloud-one" />
          <div className="farm-cloud farm-cloud-two" />
          <div className="farm-hill farm-hill-back" />
          <div className="farm-hill farm-hill-front" />
          <div className="farm-field-lines" />
          <div className="farm-fence" />
        </div>

        <section className="auth-left farm-auth-left">
          <div className="auth-brand farm-auth-brand">
            <div className="farm-logo" aria-hidden="true">🌱</div>
            <span><small>COZY LIFE RPG</small><b>ASCEND</b></span>
          </div>

          <div className="farm-hero-copy">
            <div className="farm-season-badge">☀ SPRING · DAY 1</div>
            <small>YOUR LITTLE CORNER OF PROGRESS</small>
            <h1>Grow your life,<br/>one quest at a time.</h1>
            <p>
              Turn studying, workouts, chores and habits into cozy daily quests.
              Earn XP, collect gold, build your stats and watch your journey grow.
            </p>
          </div>

          <div className="auth-modules farm-auth-modules">
            <span><b>🌱</b> DAILY QUESTS</span>
            <span><b>⭐</b> LEVEL & XP</span>
            <span><b>🪙</b> FARM GOLD</span>
          </div>
        </section>

        <section className="auth-card farm-auth-card">
          <div className="journal-pin" aria-hidden="true">🍃</div>
          <small>{authMode === "login" ? "WELCOME BACK, FARMER" : "A NEW JOURNEY BEGINS"}</small>
          <h2>{authMode === "login" ? "Open your journal" : "Create your farm journal"}</h2>
          <p className="farm-auth-intro">
            {authMode === "login"
              ? "The valley is waiting. Pick up where you left off."
              : "Create your profile and turn today's real-life goals into quests."}
          </p>

          <form onSubmit={handleAuth}>
            <label>Email address</label>
            <input
              value={email}
              onChange={event => setEmail(event.target.value)}
              type="email"
              placeholder="farmer@example.com"
              autoComplete="email"
            />

            <label>Password</label>
            <input
              value={password}
              onChange={event => setPassword(event.target.value)}
              type="password"
              placeholder="••••••••"
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
            />

            <button className="farm-auth-submit">
              {authMode === "login" ? "🌤 START THE DAY" : "🌱 BEGIN MY JOURNEY"}
            </button>
          </form>

          {authMessage && <p className="farm-auth-message">{authMessage}</p>}

          <div className="farm-divider"><span>✿</span></div>

          <button
            className="link farm-auth-link"
            onClick={() => {
              setAuthMessage("");
              setAuthMode(authMode === "login" ? "signup" : "login");
            }}
          >
            {authMode === "login"
              ? "New to the valley? Create your journal"
              : "Already have a journal? Return to login"}
          </button>

          <div className="farm-save-note">
            💾 Your quests and progress are saved to your account.
          </div>
        </section>
      </main>
    );
  }

  const nav = [
    { key: "quests" as View, label: "QUEST MATRIX", icon: Radio },
    { key: "focus" as View, label: "FOCUS CLOCK", icon: History },
    { key: "skills" as View, label: "SKILL NEXUS", icon: Boxes },
    { key: "bazaar" as View, label: "BAZAAR & VAULT", icon: ShoppingBag },
    { key: "raids" as View, label: "SQUAD RAIDS", icon: Users },
    { key: "telemetry" as View, label: "TELEMETRY FEED", icon: BarChart3 },
    { key: "profile" as View, label: "OPERATIVE PROFILE", icon: UserRound },
  ];

  return (
    <main className={`shell ${screenShake ? "screen-shake" : ""}`} onClick={startAmbient}>
      <div className="stars"/><div className="scanlines"/>
      {particles.map((id, index) => <span key={id} className="particle" style={{
        left: `${47 + Math.random() * 7}%`, top: `${28 + Math.random() * 12}%`,
        ["--dx" as string]: `${(Math.random() - 0.5) * 560}px`,
        ["--dy" as string]: `${(Math.random() - 0.8) * 430}px`,
        animationDelay: `${index * 7}ms`,
      } as React.CSSProperties}/>) }
      {toast && <div className="toast"><WandSparkles/>{toast}</div>}
      {xpFloat && <div className="float-xp">{xpFloat}</div>}
      {goldFloat && <div className="float-gold">{goldFloat}</div>}
      {levelOverlay && <div className="level-overlay"><div className="level-ring-big"><Star/><span>LEVEL UP</span><b>{levelOverlay}</b><small>VANGUARD STATUS INCREASED</small></div></div>}

      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="side-brand"><Hexagon/><span><small>LIFE RPG</small><b>ASCEND</b></span></div>
        <div className="operative"><small>OPERATIVE SPEC</small><b>CYBERNETICIST</b><span>Neural Load <em>42% OK</em></span></div>
        <nav>{nav.map(item => {
          const Icon = item.icon;
          return <button key={item.key} className={view === item.key ? "active" : ""} onMouseEnter={() => playSound("hover")} onClick={() => navigate(item.key)}><Icon/>{item.label}</button>;
        })}</nav>
        <div className="neural"><small>NEURAL LINK</small><b>NODE // 0x8820-CYAN</b><i/></div>
      </aside>

      <section className="workspace">
        <header className={`topbar ${hudPulse ? "hud-pulse" : ""}`}>
          <button className="menu" onClick={() => setMobileNav(value => !value)}><Menu/></button>
          <div className="top-stats">
            <span><b>LVL {level.level}</b><i><em style={{ width: `${xpPct}%` }}/></i></span>
            <span><Flame/>{profile?.streak ?? 0} ACTIVE</span>
            <span><Coins/>{profile?.gold ?? 0}</span>
            <span><Zap/>{profile?.total_xp ?? 0} XP</span>
          </div>
          <div className="top-actions">
            <button onMouseEnter={() => playSound("hover")} onClick={() => navigate("bazaar")}><ShoppingBag/>ARMORY / BAZAAR</button>
            <button onClick={toggleSound}>{state?.sound_enabled ? <Volume2/> : <VolumeX/>} SFX: {state?.sound_enabled ? "ON" : "OFF"}</button>
            <button className="profile-btn" onClick={() => navigate("profile")}>{(profile?.display_name || "VANGUARD").toUpperCase()}</button>
            <button aria-label="Sign out" onClick={() => supabase.auth.signOut()}><LogOut/></button>
          </div>
        </header>

        <div className="status-line"><span>● CYBERSPACE LINK: ACTIVE</span><span>SECTOR: 0X77-DELTA-TACTICAL</span><span>SYNAPSE CLOCK: CYCLE {clock}</span><button onClick={() => quickForge()}>⚡ QUICK FORGE</button></div>

        <div className="view-transition" key={view}>
          {view === "quests" && <section className="main-grid">
            <aside className="character-card panel">
              <div className="char-head"><span><small>NEURAL IDENTIFIER</small><b>{(profile?.display_name || "VANGUARD-049").toUpperCase()}</b></span><em>{level.level >= 10 ? "MYTHIC" : level.level >= 5 ? "VANGUARD" : "INITIATE"}</em></div>
              <div className="level-ring" style={{ ["--progress" as string]: `${xpPct * 3.6}deg` } as React.CSSProperties}><div><small>LEVEL</small><b>{level.level}</b><span>APEX SPEC</span></div></div>
              <div className="threshold"><span><small>XP THRESHOLD</small><b>{level.current} / {level.needed}</b></span><i><em style={{ width: `${xpPct}%` }}/></i><p>PROGRESS TO LVL <b>{Math.max(0, level.needed - level.current)} XP REMAINING</b></p></div>
              <div className="synapse"><small>SYNAPSE ATTRIBUTES</small>{(["intellect","strength","discipline","creativity"] as Attribute[]).map(attr => { const Icon = attributeIcons[attr]; const value = profile?.[attr] ?? 1; return <div key={attr}><span><Icon/><b>{attr}</b></span><em>{value}</em><i><strong style={{ width: `${Math.min(100, value)}%` }}/></i></div>; })}</div>
              <div className="buffs"><small>RESONANCE BUFFS <b>{Number((state?.xp_boost_uses ?? 0) > 0) + Number((state?.gold_boost_uses ?? 0) > 0) + Number((state?.streak_shields ?? 0) > 0)} ACTIVE</b></small><div><span>⚗<b>XP ELIXIR</b><em>{state?.xp_boost_uses ?? 0} USES</em></span><span>◉<b>GOLD MAGNET</b><em>{state?.gold_boost_uses ?? 0} USES</em></span><span>⬡<b>STREAK AEGIS</b><em>{state?.streak_shields ?? 0} STORED</em></span></div></div>
              <button className="rail-button" onClick={() => navigate("skills")}><Boxes/>OPEN SKILL NEXUS<ChevronRight/></button>
            </aside>

            <section className="content-column">
              <article className={`boss panel theme-boss-${currentTheme} ${bossHit ? "boss-hit" : ""}`}>
                <div className="boss-title">
                  <div><span>{currentBoss.label}</span><em>{currentBoss.threat}</em></div>
                  <h1>{bossHp === 0 ? currentBoss.defeatedName : currentBoss.name}</h1>
                  <p>{bossHp === 0 ? `${currentBoss.defeatedLabel} for this weekly cycle.` : currentBoss.description}</p>
                </div>
                <div className="boss-body">
                  <div className="boss-visual">
                    <div className="monster boss-monster" aria-label={currentBoss.name}>
                      <span className="boss-glyph" aria-hidden="true">{currentBoss.glyph}</span>
                    </div>
                    <small>{currentBoss.targetLabel}</small>
                  </div>
                  <div className="boss-health">
                    <span>{currentBoss.hpLabel} (HP)</span>
                    <h2>{bossHp * 1200} / 120,000 <small>HP ({bossHp}%)</small></h2>
                    <i><em style={{ width: `${bossHp}%` }}/></i>
                    <div className="boss-stats">
                      <span><small>QUEST HITS</small><b>{completedThisWeek}</b></span>
                      <span><small>BONUS DAMAGE</small><b>{bonusDamage}%</b></span>
                      <span><small>REWARD STATUS</small><b>{bossClaimed ? "CLAIMED" : "300 G"}</b></span>
                    </div>
                  </div>
                </div>
                <div className="boss-spoils">
                  <span>BOSS SPOILS:</span>
                  <b><Coins/>300 G</b>
                  <b>◉ {currentBoss.rewardToken}</b>
                  <b><Trophy/>WEEKLY CLEAR</b>
                </div>
                <button className="boss-strike" disabled={bossHp === 0} onClick={executeBossStrike}>
                  <Target/>{bossHp === 0 ? currentBoss.defeatedLabel : `${currentBoss.strikeLabel} (-150 G)`}
                </button>
              </article>

              <section className="directive-tabs"><button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>ACTIVE DIRECTIVES ({activeTasks.length})</button><button className={filter === "cleared" ? "active" : ""} onClick={() => setFilter("cleared")}>VANQUISHED ({clearedTasks.length})</button><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>ALL DIRECTIVES ({tasks.length})</button></section>
              <div className="sort-line"><span>SORT MATRIX:</span><button onClick={() => setSortMode(sortMode === "high" ? "newest" : sortMode === "newest" ? "reward" : "high")}>{sortMode === "high" ? "DIFFICULTY: HIGH-FIRST" : sortMode === "newest" ? "NEWEST FIRST" : "REWARD: HIGH-FIRST"}</button></div>
              <form className="quest-forge panel" onSubmit={addQuest}><input ref={questInput} value={title} onChange={event => setTitle(event.target.value)} placeholder="Directive objective..."/><select value={difficulty} onChange={event => setDifficulty(event.target.value as "easy" | "medium" | "hard")}><option value="easy">C-RANK (+25 XP)</option><option value="medium">B-RANK (+60 XP)</option><option value="hard">S-RANK (+120 XP)</option></select><select value={attribute} onChange={event => setAttribute(event.target.value as Attribute)}><option value="intellect">INTELLECT</option><option value="strength">STRENGTH</option><option value="discipline">DISCIPLINE</option><option value="creativity">CREATIVITY</option></select><button><Plus/>ACCEPT QUEST</button></form>
              <section className="quests">{filteredTasks.map(task => { const Icon = attributeIcons[task.attribute]; const reward = rewardForDifficulty(task.difficulty); const rank = task.difficulty === "hard" ? "S" : task.difficulty === "medium" ? "B" : "C"; return <article className={`quest panel ${task.completed ? "done" : ""}`} key={task.id}><div className={`rank ${task.difficulty}`}>{rank}-RANK</div><div className="quest-copy"><small>DIR ID: {task.id.slice(0, 8).toUpperCase()} // {task.attribute.toUpperCase()}</small><h3>{task.title}</h3><div><span><Zap/>+{reward.xp}{state?.xp_boost_uses ? " ×1.5" : ""} XP</span><span><Coins/>+{reward.gold}{state?.gold_boost_uses ? " ×1.5" : ""} G</span><span><Icon/>{task.attribute.toUpperCase()}</span></div></div>{!task.completed ? <button className="complete" onMouseEnter={() => playSound("hover")} onClick={() => completeQuest(task)}><CheckCircle2/>COMPLETE QUEST</button> : <span className="cleared"><Check/>VANQUISHED</span>}<button className="trash" aria-label="Delete quest" onClick={() => deleteQuest(task.id)}><Trash2/></button></article>; })}{filteredTasks.length === 0 && <div className="empty panel">NO DIRECTIVES FOUND IN CURRENT MATRIX</div>}</section>
            </section>
          </section>}

          {view === "focus" && <section className="single-view focus-view">
            <div className="view-heading">
              <div>
                <small>PRODUCTIVITY MODULE // POMODORO</small>
                <h1>Focus Clock</h1>
                <p>Run a focused work sprint, recover, then return stronger. One cycle at a time.</p>
              </div>
              <div className="focus-session-chip">
                <span>🍅</span>
                <div><small>FOCUS SESSIONS</small><b>{pomodoroSessions}</b></div>
              </div>
            </div>

            <div className="focus-layout">
              <article className="focus-timer panel">
                <div className="focus-presets">
                  <button
                    className={pomodoroMode === "focus" ? "active" : ""}
                    onClick={() => changePomodoroMode("focus")}
                  >
                    FOCUS · 25
                  </button>
                  <button
                    className={pomodoroMode === "short" ? "active" : ""}
                    onClick={() => changePomodoroMode("short")}
                  >
                    SHORT BREAK · 5
                  </button>
                  <button
                    className={pomodoroMode === "long" ? "active" : ""}
                    onClick={() => changePomodoroMode("long")}
                  >
                    LONG BREAK · 15
                  </button>
                </div>

                <div
                  className={`pomodoro-ring ${pomodoroRunning ? "running" : ""}`}
                  style={{ ["--focus-progress" as string]: `${pomodoroProgress * 3.6}deg` } as React.CSSProperties}
                >
                  <div className="pomodoro-core">
                    <small>{pomodoroMode === "focus" ? "DEEP FOCUS" : pomodoroMode === "short" ? "QUICK RECOVERY" : "FULL RECOVERY"}</small>
                    <strong>{pomodoroDisplay}</strong>
                    <span>{pomodoroRunning ? "SESSION ACTIVE" : pomodoroSeconds === 0 ? "CYCLE COMPLETE" : "READY"}</span>
                  </div>
                </div>

                <div className="focus-controls">
                  <button className="focus-primary" onClick={togglePomodoro}>
                    {pomodoroRunning ? "PAUSE SESSION" : pomodoroSeconds === 0 ? "START NEXT CYCLE" : "START FOCUS"}
                  </button>
                  <button onClick={resetPomodoro}>RESET</button>
                </div>

                <div className="focus-cycle">
                  <span>CYCLE TARGET</span>
                  <div>
                    {[0, 1, 2, 3].map(index => (
                      <i key={index} className={pomodoroSessions % 4 > index ? "complete" : ""} />
                    ))}
                  </div>
                  <b>{pomodoroSessions % 4}/4</b>
                </div>
              </article>

              <aside className="focus-side">
                <article className="panel focus-guide">
                  <small>FOCUS PROTOCOL</small>
                  <h2>25 → 5 → repeat</h2>
                  <p>Work on one quest for 25 minutes. Take a five-minute recovery break. After four focus sessions, use the 15-minute long break.</p>
                  <div className="focus-rules">
                    <span><b>01</b> Pick one quest only.</span>
                    <span><b>02</b> Silence distractions.</span>
                    <span><b>03</b> Do not switch tasks mid-cycle.</span>
                    <span><b>04</b> Recover when the timer ends.</span>
                  </div>
                </article>

                <article className="panel focus-streak-card">
                  <small>TODAY'S MOMENTUM</small>
                  <div className="focus-stat-row"><span>QUESTS CLEARED</span><b>{todayClears}</b></div>
                  <div className="focus-stat-row"><span>FOCUS CYCLES</span><b>{pomodoroSessions}</b></div>
                  <div className="focus-stat-row"><span>ACTIVE STREAK</span><b>{profile?.streak ?? 0} DAYS</b></div>
                </article>
              </aside>
            </div>
          </section>}

          {view === "skills" && <section className="single-view"><div className="view-heading"><div><small>SKILL NEXUS</small><h1>Synapse Attributes</h1><p>Every completed directive permanently upgrades the attribute tied to it.</p></div><button onClick={() => quickForge()}><Plus/>FORGE NEW QUEST</button></div><div className="skill-grid">{(["intellect","strength","discipline","creativity"] as Attribute[]).map(attr => { const Icon = attributeIcons[attr]; const value = profile?.[attr] ?? 1; return <article className={`skill-card panel skill-${attr}`} key={attr}><div className="skill-icon"><Icon/></div><small>{attr.toUpperCase()} PROTOCOL</small><h2>{value}</h2><div className="skill-progress"><i style={{ width: `${Math.min(100, value)}%` }}/></div><p>{attr === "intellect" ? "Study, coding, research, deep work and problem solving." : attr === "strength" ? "Training, movement, recovery and physical challenges." : attr === "discipline" ? "Consistency, routines, difficult habits and focused execution." : "Design, writing, ideation and creative production."}</p><button onClick={() => quickForge(attr)}>FORGE {attr.toUpperCase()} QUEST<ChevronRight/></button></article>; })}</div></section>}

          {view === "bazaar" && <section className="single-view"><div className="view-heading"><div><small>ARMORY / BAZAAR</small><h1>Spend gold. Change the run.</h1><p>Boosts are repeatable. Relics are permanent. Themes transform the command interface.</p></div><div className="wallet"><Coins/>{profile?.gold ?? 0} GOLD</div></div><nav className="shop-tabs"><button className={shopTab === "boosts" ? "active" : ""} onClick={() => setShopTab("boosts")}>BOOSTS</button><button className={shopTab === "relics" ? "active" : ""} onClick={() => setShopTab("relics")}>RELICS & TOMES</button><button className={shopTab === "themes" ? "active" : ""} onClick={() => setShopTab("themes")}>THEMES</button></nav><div className="shop-grid">{storeItems.filter(item => shopTab === "boosts" ? item.kind === "boost" || item.kind === "crate" : shopTab === "relics" ? item.kind === "relic" || item.kind === "tome" : item.kind === "theme").map(item => { const ownedItem = owned.includes(item.key); const equipped = item.kind === "theme" && state?.equipped_theme === item.theme; return <article className={`shop-card panel accent-${item.accent}`} key={item.key}><div className="rarity">{item.rarity}</div><div className="item-glyph">{item.glyph}</div><h3>{item.name}</h3><p>{item.desc}</p><button disabled={item.kind === "relic" && ownedItem} onClick={() => buyStoreItem(item)}>{equipped ? "EQUIPPED" : item.kind === "theme" && ownedItem ? "EQUIP" : item.kind === "relic" && ownedItem ? "OWNED" : `${item.price} GOLD`}</button></article>; })}</div><div className="vault panel"><div><small>VAULT INVENTORY</small><h2>{owned.length} RELICS / THEMES OWNED</h2></div><div className="vault-chips">{owned.length ? owned.map(key => <span key={key}>{key.replaceAll("_", " ").toUpperCase()}</span>) : <span>VAULT EMPTY</span>}</div></div></section>}

          {view === "raids" && <section className="single-view"><div className="view-heading"><div><small>SQUAD RAIDS // SOLO SIMULATION</small><h1>Daily Strike Protocol</h1><p>Clear three directives in one day to open the raid cache.</p></div><span className={`raid-status ${raidReady ? "ready" : ""}`}>{raidClaimed ? "CACHE CLAIMED" : raidReady ? "CACHE READY" : "IN PROGRESS"}</span></div><article className="raid-card panel"><div className="raid-art"><Users/><div className="radar-lines"/></div><div className="raid-copy"><small>DAILY RAID OBJECTIVE</small><h2>Operation: Momentum</h2><p>Complete any three quests before local midnight. Every clear charges the raid core.</p><div className="raid-progress"><i style={{ width: `${Math.min(100, todayClears / 3 * 100)}%` }}/></div><div className="raid-stats"><span><b>{todayClears}/3</b> DIRECTIVES CLEARED</span><span><b>75 G</b> RAID CACHE</span><span><b>{profile?.streak ?? 0}</b> DAY STREAK</span></div><button disabled={!raidReady || raidClaimed} onClick={claimRaid}>{raidClaimed ? "CACHE CLAIMED" : raidReady ? "CLAIM RAID CACHE" : "COMPLETE 3 QUESTS TO UNLOCK"}</button></div></article></section>}

          {view === "telemetry" && <section className="single-view"><div className="view-heading"><div><small>TELEMETRY FEED</small><h1>Performance Analytics</h1><p>Your latest seven-day output, recorded from completed directives.</p></div><button onClick={() => uid && loadData(uid)}><Activity/>REFRESH FEED</button></div><div className="telemetry-cards"><article className="metric panel"><Zap/><span>7-DAY XP</span><b>{weeklyXp}</b></article><article className="metric panel"><Coins/><span>7-DAY GOLD</span><b>{weeklyGold}</b></article><article className="metric panel"><CheckCircle2/><span>QUESTS CLEARED</span><b>{weeklyCompletions}</b></article><article className="metric panel"><Flame/><span>CURRENT STREAK</span><b>{profile?.streak ?? 0}</b></article></div><article className="activity-feed panel"><div className="feed-head"><small>RECENT COMBAT LOG</small><span>{activity.length} EVENTS</span></div>{activity.length ? activity.slice(0, 12).map(row => <div className="activity-row" key={row.id}><div className="activity-dot"/><div><b>DIRECTIVE VANQUISHED</b><span>{row.attribute?.toUpperCase() || "GENERAL"} // {new Date(row.created_at).toLocaleString()}</span></div><em>+{row.xp_earned} XP</em><strong>+{row.gold_earned} G</strong></div>) : <div className="feed-empty">NO TELEMETRY RECORDED YET</div>}</article></section>}

          {view === "profile" && <section className="single-view"><div className="view-heading"><div><small>OPERATIVE PROFILE</small><h1>Neural Identity</h1><p>Manage your display identity, audio system and current interface configuration.</p></div><button onClick={() => supabase.auth.signOut()}><LogOut/>SIGN OUT</button></div><div className="profile-grid"><article className="profile-card panel"><div className="avatar-core"><Crown/></div><small>DISPLAY NAME</small><input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={40}/><button onClick={saveProfile}><Save/>SAVE IDENTITY</button></article><article className="profile-card panel"><small>SYSTEM SETTINGS</small><div className="setting-row"><span><Volume2/>SOUND & AMBIENCE</span><button onClick={toggleSound}>{state?.sound_enabled ? "ENABLED" : "DISABLED"}</button></div><div className="setting-row"><span><Palette/>EQUIPPED THEME</span><b>{(state?.equipped_theme ?? "farmstead").toUpperCase()}</b></div><div className="setting-row"><span><History/>ACCOUNT LEVEL</span><b>LVL {level.level}</b></div></article><article className="profile-card panel"><small>CAREER SUMMARY</small><div className="summary-grid"><span><b>{tasks.length}</b>TOTAL QUESTS</span><span><b>{clearedTasks.length}</b>VANQUISHED</span><span><b>{owned.length}</b>VAULT ITEMS</span><span><b>{profile?.total_xp ?? 0}</b>LIFETIME XP</span></div></article></div></section>}
        </div>
      </section>
    </main>
  );
}
