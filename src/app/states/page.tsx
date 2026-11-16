"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Chip, PageHeader, ShowMore } from "@/components/ui";
import { REGION_COLOURS, STATES, type Region } from "@/lib/content";
import { useProgress } from "@/lib/progress";

const REGIONS = Object.keys(REGION_COLOURS) as Region[];

export default function StatesPage() {
  const p = useProgress();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<Region | "all">("all");
  const [type, setType] = useState<"all" | "state" | "ut">("all");

  const list = useMemo(
    () =>
      STATES.filter(
        (s) =>
          (region === "all" || s.region === region) &&
          (type === "all" || s.type === type) &&
          (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.capital.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, region, type],
  );

  return (
    <div>
      <PageHeader title="Learn States" subtitle={`${p.statesViewed.length} of ${STATES.length} explored. Tap a card to start learning!`} />
      <div className="mb-5 space-y-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            aria-label="Search states"
            className="w-full rounded-2xl border-2 border-line bg-white py-3 pl-11 pr-4 text-lg outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "state", "ut"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`rounded-full px-4 py-2 font-display font-semibold ${type === t ? "bg-ink text-white" : "bg-white text-ink-soft"}`}>
              {t === "all" ? "All 36" : t === "state" ? "28 States" : "8 Union Territories"}
            </button>
          ))}
          <span className="mx-1 w-px bg-line" />
          {(["all", ...REGIONS] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-display font-semibold ${region === r ? "bg-primary text-white" : "bg-white text-ink-soft"}`}
            >
              {r !== "all" && <span className="size-3 rounded-full" style={{ background: REGION_COLOURS[r] }} />}
              {r === "all" ? "Every region" : r}
            </button>
          ))}
        </div>
      </div>

      <ShowMore
        key={`${q}|${region}|${type}`}
        items={list}
        initial={q || region !== "all" || type !== "all" ? list.length : 9}
        noun="states"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        render={(s) => {
          const seen = p.statesViewed.includes(s.id);
          return (
            <Link
              key={s.id}
              href={`/states/${s.id}`}
              className="relative overflow-hidden rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1"
            >
              <span className="absolute inset-y-0 left-0 w-2" style={{ background: REGION_COLOURS[s.region] }} />
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold leading-tight">{s.name}</h2>
                {seen && (
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success text-white" title="Explored">
                    <Check className="size-4" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-ink-soft">Capital: <b className="text-ink">{s.capital}</b></p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip className={s.type === "ut" ? "bg-accent-soft text-[#b4471c]" : "bg-primary-soft text-primary"}>{s.type === "ut" ? "UT" : "State"}</Chip>
                <Chip className="bg-bg text-ink-soft">{s.districtCount} districts</Chip>
                <Chip className="bg-bg text-ink-soft">{s.region}</Chip>
              </div>
            </Link>
          );
        }}
      />
    </div>
  );
}
