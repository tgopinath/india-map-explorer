"use client";

// Optional cloud backup of progress to Supabase. Off unless NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY are set. Only the progress object is sent, under a random
// device id; no names, emails or other personal details. Schema: supabase/schema.sql.

import { createClient } from "@supabase/supabase-js";
import { getProgress, subscribeProgress } from "./progress";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const syncEnabled = Boolean(URL && KEY);

function deviceId() {
  try {
    let id = localStorage.getItem("imx-device");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("imx-device", id);
    }
    return id;
  } catch {
    return null;
  }
}

export function startSync() {
  if (!syncEnabled) return;
  const id = deviceId();
  if (!id) return;
  const db = createClient(URL!, KEY!, { auth: { persistSession: false } });
  let timer: number | undefined;
  let lastQuizAt = getProgress().quizzes[0]?.at ?? "";
  const push = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const p = getProgress();
      void db.from("progress").upsert({ device_id: id, data: p, points: p.points, updated_at: new Date().toISOString() });
      const fresh = p.quizzes.filter((q) => q.at > lastQuizAt);
      if (fresh.length) {
        lastQuizAt = fresh[0].at;
        void db.from("quiz_results").insert(
          fresh.map((q) => ({ device_id: id, level: q.level, state_id: q.stateId ?? null, correct: q.correct, total: q.total, score: q.score, time_sec: q.timeSec, stars: q.stars, created_at: q.at })),
        );
      }
    }, 3000);
  };
  const off = subscribeProgress(push);
  return () => {
    off();
    window.clearTimeout(timer);
  };
}
