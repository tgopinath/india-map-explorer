"use client";

import Link from "next/link";
import { Award, Clock, Compass, Flame, Lock, Map as MapIcon, Puzzle, Star, Trophy } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { Card, PageHeader, ProgressBar, ShowMore, Stars } from "@/components/ui";
import { getState, PILOT_STATE, STATES } from "@/lib/content";
import { BADGES, levelFor, LEVELS, useProgress } from "@/lib/progress";

export default function ProgressPage() {
  const p = useProgress();
  const lvl = levelFor(p.points);
  const minutes = Math.round(Object.values(p.timeByDay).reduce((a, b) => a + b, 0) / 60);
  const districtsTotal = Object.values(p.districtsLearned).reduce((a, b) => a + b.length, 0);
  const puzzleRows = Object.entries(p.puzzles).sort((a, b) => b[1].stars - a[1].stars);
  const tn = getState(PILOT_STATE)!;

  return (
    <div className="space-y-6">
      <PageHeader title="My Progress" subtitle="Every map you explore helps you grow!" />

      <Card className="flex flex-col gap-5 bg-primary text-white sm:flex-row sm:items-center">
        <Mascot mood="cheer" size={110} />
        <div className="flex-1">
          <p className="font-display font-bold text-secondary">Level {lvl.index + 1} of {LEVELS.length}</p>
          <h2 className="text-4xl font-extrabold">{lvl.name}</h2>
          <ProgressBar value={lvl.pct} tone="bg-secondary" className="mt-3 bg-white/25" />
          <p className="mt-1 text-white/85">
            {p.points.toLocaleString()} points{lvl.next ? ` · ${(lvl.next.min - p.points).toLocaleString()} to ${lvl.next.name}` : " · top level!"}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={Flame} tint="text-accent" label="Day streak" value={`${p.streak.current}`} sub={`Best ${p.streak.best}`} />
        <Tile icon={Compass} tint="text-primary" label="States explored" value={`${new Set([...p.statesViewed, ...p.statesExplored]).size}/${STATES.length}`} />
        <Tile icon={MapIcon} tint="text-success" label="Districts learned" value={String(districtsTotal)} sub={`${p.districtsLearned[PILOT_STATE]?.length ?? 0}/${tn.districtCount} in Tamil Nadu`} />
        <Tile icon={Clock} tint="text-[#7b55e0]" label="Time learning" value={`${minutes} min`} />
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold"><Award className="size-6 text-accent" /> Badges</h2>
        <ShowMore
          items={[...BADGES].sort((a, b) => Number(Boolean(p.badges[b.id])) - Number(Boolean(p.badges[a.id])))}
          initial={4}
          noun="badges"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          render={(b) => {
            const got = Boolean(p.badges[b.id]);
            return (
              <Card key={b.id} className={`flex flex-col items-center gap-2 p-4 text-center ${got ? "" : "opacity-60"}`}>
                <div
                  className="grid size-16 place-items-center rounded-full"
                  style={{ background: got ? b.colour : "#e3e8f2", boxShadow: got ? `0 4px 0 ${b.colour}66` : undefined }}
                >
                  {got ? <Star className="size-8 fill-white text-white" /> : <Lock className="size-6 text-ink-soft" />}
                </div>
                <p className="font-display text-lg font-bold leading-tight">{b.name}</p>
                <p className="text-sm text-ink-soft">{b.description}</p>
              </Card>
            );
          }}
        />
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Puzzle className="size-5 text-accent" /> Puzzles</h2>
          {puzzleRows.length ? (
            <ul className="space-y-2">
              {puzzleRows.map(([k, v]) => {
                const [id, level] = k.split(":");
                return (
                  <li key={k} className="flex items-center justify-between rounded-2xl bg-bg px-4 py-2">
                    <span className="font-semibold">{id === "india" ? "India states" : getState(id)?.name} · <span className="capitalize text-ink-soft">{level}</span></span>
                    <Stars count={v.stars} size="size-5" />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-ink-soft">No puzzles yet. <Link href="/puzzle" className="font-bold text-primary">Try one!</Link></p>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Trophy className="size-5 text-[#e5a100]" /> Recent quizzes</h2>
          {p.quizzes.length ? (
            <ul className="space-y-2">
              {p.quizzes.slice(0, 6).map((q) => (
                <li key={q.at} className="flex items-center justify-between rounded-2xl bg-bg px-4 py-2">
                  <span className="font-semibold capitalize">{q.level}{q.stateId ? ` · ${getState(q.stateId)?.name}` : ""}</span>
                  <span className="flex items-center gap-3 text-sm font-bold text-ink-soft">
                    {q.correct}/{q.total} <Stars count={q.stars} size="size-4" />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-soft">No quizzes yet. <Link href="/quiz" className="font-bold text-primary">Take the Beginner quiz!</Link></p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, tint, label, value, sub }: { icon: typeof Flame; tint: string; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <Icon className={`size-6 ${tint}`} />
      <p className="mt-2 text-sm font-bold text-ink-soft">{label}</p>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      {sub && <p className="text-sm text-ink-soft">{sub}</p>}
    </Card>
  );
}
