"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Lock, Medal, Rocket, Sprout } from "lucide-react";
import QuizRunner from "@/components/QuizRunner";
import { MascotSays } from "@/components/Mascot";
import { Card, PageHeader, Stars } from "@/components/ui";
import { GAMES } from "@/components/games/registry";
import { PILOT_STATE, STATES, stateName } from "@/lib/content";
import { capitalMcqQs, districtMcqQs, identifyStateQs, neighbourMcqQs } from "@/lib/questions";
import { actions, unlocks, useProgress, type QuizLevel } from "@/lib/progress";
import { shuffle } from "@/lib/content";

const LEVELS: { id: QuizLevel; title: string; text: string; icon: typeof Sprout; bg: string; fg: string }[] = [
  { id: "beginner", title: "Beginner", text: "Name the glowing state", icon: Sprout, bg: "bg-success-soft", fg: "text-success" },
  { id: "intermediate", title: "Intermediate", text: "Capitals & neighbours", icon: Medal, bg: "bg-secondary-soft", fg: "text-[#c58a00]" },
  { id: "advanced", title: "Advanced", text: "Identify districts on the map", icon: Rocket, bg: "bg-accent-soft", fg: "text-accent" },
];

// District quizzes need dependable boundaries.
const DISTRICT_STATES = STATES.filter((s) => s.dataStatus !== "issues" && s.districtCount >= 4);

export default function QuizPage() {
  const p = useProgress();
  const [level, setLevel] = useState<QuizLevel | null>(null);
  const [stateId, setStateId] = useState(PILOT_STATE);

  if (level) {
    const make =
      level === "beginner"
        ? () => identifyStateQs(10)
        : level === "intermediate"
          ? () => shuffle([...capitalMcqQs(5), ...neighbourMcqQs(5)])
          : () => districtMcqQs(stateId, 10);
    return (
      <div>
        <button type="button" onClick={() => setLevel(null)} className="mb-3 inline-flex items-center gap-1 font-display font-bold text-primary">
          <ArrowLeft className="size-5" /> All quizzes
        </button>
        <PageHeader
          title={`${LEVELS.find((l) => l.id === level)!.title} Quiz`}
          subtitle={level === "advanced" ? `Districts of ${stateName(stateId)}` : "10 questions · faster answers earn bonus points"}
        />
        <QuizRunner
          key={`${level}-${stateId}`}
          make={make}
          stateId={level === "advanced" ? stateId : undefined}
          onFinish={(r) => actions.finishQuiz({ level, stateId: level === "advanced" ? stateId : undefined, correct: r.correct, total: r.total, score: r.score, timeSec: r.timeSec, stars: r.stars })}
          backHref="/progress"
          backLabel="See my progress"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Quiz Challenge" subtitle="Earn 2 stars on a level to unlock the next one." />
      <div className="grid gap-4 md:grid-cols-3">
        {LEVELS.map((l) => {
          const open = unlocks.quiz(p, l.id);
          const best = p.quizBest[l.id];
          return (
            <Card key={l.id} className={`flex flex-col gap-3 ${open ? "" : "opacity-70"}`}>
              <div className={`grid size-16 place-items-center rounded-2xl ${l.bg}`}>
                {open ? <l.icon className={`size-8 ${l.fg}`} /> : <Lock className="size-7 text-ink-soft" />}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">{l.title}</h2>
                <p className="text-ink-soft">{l.text}</p>
              </div>
              <div className="flex items-center justify-between">
                <Stars count={best?.stars ?? 0} />
                {best && <span className="text-sm font-bold text-ink-soft">Best {best.score}</span>}
              </div>
              {l.id === "advanced" && open && (
                <label className="block">
                  <span className="text-sm font-bold text-ink-soft">State</span>
                  <select
                    value={stateId}
                    onChange={(e) => setStateId(e.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-line bg-white px-3 py-2 font-semibold"
                  >
                    {DISTRICT_STATES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.id === PILOT_STATE ? " ⭐" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                disabled={!open}
                onClick={() => setLevel(l.id)}
                className="mt-auto rounded-2xl bg-primary px-5 py-3 font-display text-lg font-bold text-white shadow-[0_4px_0_#2450bd] transition active:translate-y-[3px] active:shadow-none disabled:bg-line disabled:text-ink-soft disabled:shadow-none"
              >
                {open ? "Start" : l.id === "intermediate" ? "Get 2★ in Beginner" : "Get 2★ in Intermediate"}
              </button>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <MascotSays mood="think" className="mb-3">Want something quicker? Try a mini game!</MascotSays>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {GAMES.map((g) => (
            <Link key={g.id} href={g.href} className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5">
              <g.icon className="mb-2 size-7" style={{ color: g.fg }} />
              <p className="font-display text-lg font-bold leading-tight">{g.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
