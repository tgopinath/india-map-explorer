"use client";

// Learning progress, stored on this device only. No names, emails or other personal
// details are collected. Optional cloud backup (src/lib/sync.ts) sends this same object
// under a random device id.

import { useSyncExternalStore } from "react";

export type PuzzleLevel = "easy" | "medium" | "hard";
export type QuizLevel = "beginner" | "intermediate" | "advanced";

export interface PuzzleRecord {
  bestScore: number;
  stars: number;
  bestTimeSec: number | null;
  plays: number;
}
export interface QuizRecord {
  level: QuizLevel;
  stateId?: string;
  correct: number;
  total: number;
  score: number;
  timeSec: number;
  stars: number;
  at: string;
}

export interface Progress {
  version: 1;
  points: number;
  statesViewed: string[];
  statesExplored: string[];
  countriesExplored: string[];
  districtsLearned: Record<string, string[]>;
  puzzles: Record<string, PuzzleRecord>;
  quizzes: QuizRecord[];
  quizBest: Partial<Record<QuizLevel, { stars: number; score: number }>>;
  games: Record<string, { plays: number; bestScore: number }>;
  /** keys like "state:kerala" or "district:tamil-nadu:chennai" */
  mistakes: Record<string, number>;
  correct: Record<string, number>;
  streak: { current: number; best: number; lastDay: string | null };
  timeByDay: Record<string, number>;
  badges: Record<string, string>;
  soundOn: boolean;
  /** speak names, facts and questions for children who can't read yet */
  readAloud: boolean;
  /** language used when reading names and facts aloud */
  voiceLang: "en" | "ta";
}

const KEY = "imx-progress-v1";

export const emptyProgress = (): Progress => ({
  version: 1,
  points: 0,
  statesViewed: [],
  statesExplored: [],
  countriesExplored: [],
  districtsLearned: {},
  puzzles: {},
  quizzes: [],
  quizBest: {},
  games: {},
  mistakes: {},
  correct: {},
  streak: { current: 0, best: 0, lastDay: null },
  timeByDay: {},
  badges: {},
  soundOn: true,
  readAloud: true,
  voiceLang: "en",
});

const SERVER = emptyProgress();
let current: Progress | null = null;
const listeners = new Set<() => void>();

function read(): Progress {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    current = raw ? { ...emptyProgress(), ...(JSON.parse(raw) as Progress) } : emptyProgress();
  } catch {
    current = emptyProgress();
  }
  return current;
}

function write(next: Progress) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable (private mode); progress lives in memory */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

export function useProgress() {
  return useSyncExternalStore(subscribe, read, () => SERVER);
}
export const getProgress = read;
export const subscribeProgress = subscribe;

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** Apply a change, keep the daily streak up to date, and award any newly earned badges. */
function update(fn: (p: Progress) => void) {
  const p: Progress = structuredClone(read());
  fn(p);
  const t = today();
  if (p.streak.lastDay !== t) {
    const gap = p.streak.lastDay ? daysBetween(p.streak.lastDay, t) : null;
    p.streak.current = gap === 1 ? p.streak.current + 1 : 1;
    p.streak.best = Math.max(p.streak.best, p.streak.current);
    p.streak.lastDay = t;
  }
  const fresh: string[] = [];
  for (const b of BADGES) {
    if (!p.badges[b.id] && b.earned(p)) {
      p.badges[b.id] = new Date().toISOString();
      fresh.push(b.id);
    }
  }
  write(p);
  if (fresh.length) badgeListeners.forEach((l) => l(fresh));
}

const badgeListeners = new Set<(ids: string[]) => void>();
export function onBadgeEarned(l: (ids: string[]) => void) {
  badgeListeners.add(l);
  return () => {
    badgeListeners.delete(l);
  };
}

const addUnique = (arr: string[], v: string) => (arr.includes(v) ? arr : [...arr, v]);

export const actions = {
  viewState(id: string) {
    if (read().statesViewed.includes(id)) return;
    update((p) => {
      p.statesViewed = addUnique(p.statesViewed, id);
      p.points += 10;
    });
  },
  exploreState(id: string) {
    if (read().statesExplored.includes(id)) return;
    update((p) => {
      p.statesExplored = addUnique(p.statesExplored, id);
      p.points += 5;
    });
  },
  exploreCountry(id: string) {
    if (read().countriesExplored.includes(id)) return;
    update((p) => {
      p.countriesExplored = addUnique(p.countriesExplored, id);
      p.points += 5;
    });
  },
  learnDistrict(stateId: string, districtId: string) {
    if (read().districtsLearned[stateId]?.includes(districtId)) return;
    update((p) => {
      p.districtsLearned[stateId] = addUnique(p.districtsLearned[stateId] ?? [], districtId);
      p.points += 5;
    });
  },
  answer(key: string, ok: boolean) {
    update((p) => {
      const bucket = ok ? p.correct : p.mistakes;
      bucket[key] = (bucket[key] ?? 0) + 1;
    });
  },
  finishPuzzle(stateId: string, level: PuzzleLevel, score: number, stars: number, timeSec: number | null) {
    update((p) => {
      const k = `${stateId}:${level}`;
      const prev = p.puzzles[k];
      p.puzzles[k] = {
        bestScore: Math.max(prev?.bestScore ?? 0, score),
        stars: Math.max(prev?.stars ?? 0, stars),
        bestTimeSec: timeSec == null ? prev?.bestTimeSec ?? null : Math.min(prev?.bestTimeSec ?? Infinity, timeSec),
        plays: (prev?.plays ?? 0) + 1,
      };
      p.points += score;
    });
  },
  finishQuiz(r: Omit<QuizRecord, "at">) {
    update((p) => {
      p.quizzes = [{ ...r, at: new Date().toISOString() }, ...p.quizzes].slice(0, 60);
      const best = p.quizBest[r.level];
      p.quizBest[r.level] = { stars: Math.max(best?.stars ?? 0, r.stars), score: Math.max(best?.score ?? 0, r.score) };
      p.points += r.score;
    });
  },
  finishGame(gameId: string, score: number) {
    update((p) => {
      const g = p.games[gameId];
      p.games[gameId] = { plays: (g?.plays ?? 0) + 1, bestScore: Math.max(g?.bestScore ?? 0, score) };
      p.points += score;
    });
  },
  addTime(sec: number) {
    const p = structuredClone(read());
    const t = today();
    p.timeByDay[t] = (p.timeByDay[t] ?? 0) + sec;
    write(p);
  },
  toggleSound() {
    const p = structuredClone(read());
    p.soundOn = !p.soundOn;
    write(p);
  },
  toggleReadAloud() {
    const p = structuredClone(read());
    p.readAloud = !p.readAloud;
    write(p);
  },
  setVoiceLang(lang: "en" | "ta") {
    const p = structuredClone(read());
    p.voiceLang = lang;
    write(p);
  },
  reset() {
    write(emptyProgress());
  },
};

// ---------- Badges & levels ----------

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  colour: string;
  earned: (p: Progress) => boolean;
}

const puzzleStars = (p: Progress, pred: (key: string) => boolean) =>
  Object.entries(p.puzzles).filter(([k]) => pred(k)).reduce((m, [, v]) => Math.max(m, v.stars), 0);

export const BADGES: BadgeDef[] = [
  { id: "first-steps", name: "First Steps", description: "Get your first answer right", colour: "#36b37e",
    earned: (p) => Object.keys(p.correct).length > 0 },
  { id: "india-explorer", name: "India Explorer", description: "Open 10 state learning pages", colour: "#356ae6",
    earned: (p) => p.statesViewed.length >= 10 },
  { id: "state-champion", name: "State Champion", description: "Arrange all states on the India map", colour: "#ff8b5c",
    earned: (p) => puzzleStars(p, (k) => k.startsWith("india:")) >= 1 },
  { id: "district-master", name: "District Master", description: "Finish a district puzzle with 3 stars", colour: "#8e6be8",
    earned: (p) => puzzleStars(p, (k) => !k.startsWith("india:")) >= 3 },
  { id: "geography-genius", name: "Geography Genius", description: "Pass all three quiz levels", colour: "#e5a100",
    earned: (p) => (["beginner", "intermediate", "advanced"] as QuizLevel[]).every((l) => (p.quizBest[l]?.stars ?? 0) >= 1) },
  { id: "map-master", name: "Map Master", description: "Finish any puzzle on Hard", colour: "#e5484d",
    earned: (p) => Object.keys(p.puzzles).some((k) => k.endsWith(":hard")) },
  { id: "streak-3", name: "On a Roll", description: "Learn 3 days in a row", colour: "#00a3a3",
    earned: (p) => p.streak.best >= 3 },
  { id: "world-traveller", name: "World Traveller", description: "Visit 20 countries on the world map", colour: "#2f9e8f",
    earned: (p) => p.countriesExplored.length >= 20 },
  { id: "tn-pro", name: "Tamil Nadu Pro", description: "Learn all 38 Tamil Nadu districts", colour: "#d6336c",
    earned: (p) => (p.districtsLearned["tamil-nadu"]?.length ?? 0) >= 38 },
];

export const LEVELS = [
  { name: "Little Explorer", min: 0 },
  { name: "Map Scout", min: 300 },
  { name: "Trail Finder", min: 1000 },
  { name: "Navigator", min: 2500 },
  { name: "Geo Guru", min: 5000 },
  { name: "Map Legend", min: 10000 },
];

export function levelFor(points: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i++;
  const next = LEVELS[i + 1];
  const pct = next ? (points - LEVELS[i].min) / (next.min - LEVELS[i].min) : 1;
  return { index: i, ...LEVELS[i], next, pct };
}

/** Challenges that unlock as the child progresses. */
export const unlocks = {
  quiz(p: Progress, level: QuizLevel) {
    if (level === "beginner") return true;
    if (level === "intermediate") return (p.quizBest.beginner?.stars ?? 0) >= 2;
    return (p.quizBest.intermediate?.stars ?? 0) >= 2;
  },
  puzzle(p: Progress, stateId: string, level: PuzzleLevel) {
    if (level === "easy") return true;
    if (level === "medium") return Boolean(p.puzzles[`${stateId}:easy`]);
    return Boolean(p.puzzles[`${stateId}:medium`]);
  },
};

export const starsFor = (ratio: number) => (ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0);
