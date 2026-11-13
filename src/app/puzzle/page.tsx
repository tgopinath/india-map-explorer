"use client";

import Link from "next/link";
import { Puzzle } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { DataStatusBadge, PageHeader, Stars } from "@/components/ui";
import { PILOT_STATE, STATES } from "@/lib/content";
import { useProgress, type Progress } from "@/lib/progress";

const best = (p: Progress, key: string) =>
  Math.max(0, ...(["easy", "medium", "hard"] as const).map((l) => p.puzzles[`${key}:${l}`]?.stars ?? 0));

export default function PuzzleHub() {
  const p = useProgress();
  return (
    <div>
      <PageHeader title="Map Puzzle" subtitle="Drag each name card onto the right spot on the map." />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Link href={`/puzzle/${PILOT_STATE}`} className="flex items-center gap-4 rounded-[2rem] bg-accent p-6 text-white shadow-[var(--shadow-card)] transition hover:-translate-y-1">
          <Mascot mood="cheer" size={96} />
          <div>
            <p className="font-display font-bold text-white/80">Featured</p>
            <h2 className="text-2xl font-extrabold">Tamil Nadu District Challenge</h2>
            <p className="text-white/85">38 districts · Easy, Medium & Hard</p>
            <div className="mt-2"><Stars count={best(p, PILOT_STATE)} /></div>
          </div>
        </Link>
        <Link href="/puzzle/india" className="flex items-center gap-4 rounded-[2rem] bg-primary p-6 text-white shadow-[var(--shadow-card)] transition hover:-translate-y-1">
          <div className="grid size-24 shrink-0 place-items-center rounded-3xl bg-white/15">
            <Puzzle className="size-12" />
          </div>
          <div>
            <p className="font-display font-bold text-white/80">India</p>
            <h2 className="text-2xl font-extrabold">Arrange the States</h2>
            <p className="text-white/85">28 states & 8 Union Territories</p>
            <div className="mt-2"><Stars count={best(p, "india")} /></div>
          </div>
        </Link>
      </div>

      <h2 className="mb-3 text-2xl font-bold">District puzzles for every state</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATES.filter((s) => s.id !== PILOT_STATE).map((s) => (
          <Link key={s.id} href={`/puzzle/${s.id}`} className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold leading-tight">{s.name}</h3>
                <p className="text-sm text-ink-soft">{s.districtCount} districts</p>
              </div>
              <Stars count={best(p, s.id)} size="size-5" />
            </div>
            <div className="mt-2"><DataStatusBadge status={s.dataStatus} issues={s.issues} /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
