"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { DataStatusBadge, PageHeader, ProgressBar, ShowMore } from "@/components/ui";
import { getState, PILOT_STATE, STATES } from "@/lib/content";
import { useProgress } from "@/lib/progress";

export default function DistrictsHome() {
  const p = useProgress();
  const pilot = getState(PILOT_STATE)!;
  const learned = (id: string) => p.districtsLearned[id]?.length ?? 0;

  return (
    <div>
      <PageHeader title="Learn Districts" subtitle="Pick a state and discover its districts one by one." />

      <Link
        href={`/districts/${pilot.id}`}
        className="mb-6 flex flex-col gap-4 overflow-hidden rounded-[2rem] bg-secondary p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 sm:flex-row sm:items-center"
      >
        <Mascot mood="cheer" size={110} />
        <div className="flex-1">
          <p className="flex items-center gap-1 font-display font-bold text-[#8a5b00]">
            <Star className="size-4 fill-current" /> Featured state
          </p>
          <h2 className="text-3xl font-extrabold">{pilot.name} · {pilot.districtCount} districts</h2>
          <p className="text-lg text-ink/80">Every district has a fun fact and its headquarters town.</p>
          <ProgressBar value={learned(pilot.id) / pilot.districtCount} tone="bg-success" className="mt-3 max-w-md bg-white/60" />
          <p className="mt-1 text-sm font-bold">{learned(pilot.id)} of {pilot.districtCount} learned</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-2xl bg-white px-5 py-3 font-display text-lg font-bold sm:self-center">
          Start <ArrowRight className="size-5" />
        </span>
      </Link>

      <h2 className="mb-3 text-2xl font-bold">All states & Union Territories</h2>
      <ShowMore
        items={STATES.filter((s) => s.id !== PILOT_STATE)}
        initial={6}
        noun="states"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        render={(s) => (
          <Link key={s.id} href={`/districts/${s.id}`} className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-bold leading-tight">{s.name}</h3>
              <span className="shrink-0 text-sm font-bold text-ink-soft">{s.districtCount} districts</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <DataStatusBadge status={s.dataStatus} issues={s.issues} />
              {learned(s.id) > 0 && <span className="text-sm font-bold text-success">{learned(s.id)} learned</span>}
            </div>
          </Link>
        )}
      />
    </div>
  );
}
