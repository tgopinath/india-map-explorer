"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { GAMES } from "@/components/games/registry";
import { useProgress } from "@/lib/progress";

export default function GamesHub() {
  const p = useProgress();
  return (
    <div>
      <PageHeader title="Mini Games" subtitle="Quick map games to practise what you've learned." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => {
          const rec = p.games[g.id];
          return (
            <Link key={g.id} href={g.href} className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1">
              <div className="mb-3 grid size-16 place-items-center rounded-2xl" style={{ background: g.bg }}>
                <g.icon className="size-8" style={{ color: g.fg }} />
              </div>
              <h2 className="text-2xl font-extrabold">{g.title}</h2>
              <p className="text-ink-soft">{g.blurb}</p>
              {rec && <p className="mt-2 text-sm font-bold text-ink-soft">Played {rec.plays}× · best {rec.bestScore}</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
