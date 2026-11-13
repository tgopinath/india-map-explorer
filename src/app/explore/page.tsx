"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, Landmark, Map as MapIcon, Search, Users } from "lucide-react";
import MapView from "@/components/MapView";
import { MascotSays } from "@/components/Mascot";
import { Card, Chip, LinkButton, Loading, PageHeader } from "@/components/ui";
import { getState, REGION_COLOURS, STATES, stateName } from "@/lib/content";
import { STATE_FILLS, useIndiaMap, type RegionFeature } from "@/lib/geo";
import { actions } from "@/lib/progress";
import { speakLocal } from "@/lib/speech";

export default function ExplorePage() {
  const { features, error } = useIndiaMap();
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [colourBy, setColourBy] = useState<"state" | "region">("state");
  const panelRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return STATES.filter((s) => s.name.toLowerCase().includes(q) || s.capital.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const select = (id: string) => {
    setSelected(id);
    actions.exploreState(id);
    const st = getState(id)!;
    speakLocal(
      `${st.name}. Its capital is ${st.capital.replace(/\(([^)]*)\)/g, "in $1")}.`,
      st.ta && `${st.ta.name}. இதன் தலைநகரம் ${st.ta.capital}.`,
    );
    setQuery("");
    if (window.innerWidth < 1024) window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const s = selected ? getState(selected) : null;
  const fill = (f: RegionFeature) =>
    colourBy === "region" ? REGION_COLOURS[getState(f.properties.id)!.region] : STATE_FILLS[f.properties.c];

  return (
    <div>
      <PageHeader title="Explore India" subtitle="Tap a state to learn about it. Pinch or use + to zoom in." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a state or capital…"
            aria-label="Search states"
            className="w-full rounded-2xl border-2 border-line bg-white py-3 pl-11 pr-4 text-lg outline-none focus:border-primary"
          />
          {matches.length > 0 && (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
              {matches.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => select(m.id)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-primary-soft">
                    <span className="font-display text-lg font-semibold">{m.name}</span>
                    <span className="text-sm text-ink-soft">{m.capital}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex rounded-2xl bg-white p-1 shadow-[var(--shadow-card)]">
          {(["state", "region"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setColourBy(k)}
              className={`rounded-xl px-4 py-2 font-display font-semibold ${colourBy === k ? "bg-primary text-white" : "text-ink-soft"}`}
            >
              {k === "state" ? "Colourful" : "By region"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          {error ? (
            <Card>Couldn&apos;t load the map. Please check your connection and try again.</Card>
          ) : !features ? (
            <Loading />
          ) : (
            <MapView
              features={features}
              fillFor={fill}
              selectedId={selected}
              onSelect={select}
              onHover={setHover}
              focusId={selected}
              labelFor={(f) => getState(f.properties.id)!.name}
              nameFor={(f) => getState(f.properties.id)!.name}
              ariaLabel="Map of India's states and Union Territories"
              maxHeight="78vh"
              overlay={
                hover && hover !== selected ? (
                  <div className="pointer-events-none absolute bottom-3 left-3 rounded-2xl bg-white/95 px-4 py-2 font-display text-lg font-bold shadow-[var(--shadow-card)]">
                    {stateName(hover)}
                  </div>
                ) : null
              }
            />
          )}
          {colourBy === "region" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(REGION_COLOURS).map(([r, c]) => (
                <Chip key={r} className="bg-white">
                  <span className="size-3 rounded-full" style={{ background: c }} /> {r}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div ref={panelRef} className="scroll-mt-20">
          {s ? (
            <Card className="animate-pop space-y-4" key={s.id}>
              <div>
                <Chip className={s.type === "ut" ? "bg-accent-soft text-[#b4471c]" : "bg-primary-soft text-primary"}>
                  {s.type === "ut" ? "Union Territory" : "State"} · {s.region}
                </Chip>
                <h2 className="mt-2 text-3xl font-extrabold">{s.name}</h2>
                {s.ta && <p lang="ta" className="font-display text-lg font-bold text-primary">{s.ta.name}</p>}
              </div>
              <dl className="space-y-3 text-lg">
                <div className="flex gap-3">
                  <Landmark className="mt-1 size-5 shrink-0 text-primary" />
                  <div>
                    <dt className="text-sm font-bold text-ink-soft">Capital</dt>
                    <dd className="font-semibold">{s.capital}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapIcon className="mt-1 size-5 shrink-0 text-success" />
                  <div>
                    <dt className="text-sm font-bold text-ink-soft">Districts</dt>
                    <dd className="font-semibold">{s.districtCount}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="mt-1 size-5 shrink-0 text-accent" />
                  <div>
                    <dt className="text-sm font-bold text-ink-soft">Neighbours</dt>
                    <dd className="flex flex-wrap gap-1.5 pt-1">
                      {s.neighbours.length ? (
                        s.neighbours.map((n) => (
                          <button key={n} type="button" onClick={() => select(n)} className="rounded-full bg-bg px-3 py-1 text-sm font-bold hover:bg-primary-soft">
                            {stateName(n)}
                          </button>
                        ))
                      ) : (
                        <span className="text-base text-ink-soft">None — it&apos;s surrounded by sea!</span>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
              <div className="flex flex-col gap-2">
                <LinkButton href={`/states/${s.id}`}>
                  Learn about {s.name.length > 18 ? "it" : s.name} <ArrowRight className="size-5" />
                </LinkButton>
                <LinkButton href={`/districts/${s.id}`} tone="white">
                  Explore districts
                </LinkButton>
              </div>
            </Card>
          ) : (
            <Card className="space-y-4">
              <MascotSays say>Tap any state on the map, or search for one!</MascotSays>
              <p className="text-ink-soft">
                India has <b>28 states</b> and <b>8 Union Territories</b>. Small places like Chandigarh and Lakshadweep have a dot so you can tap them easily.
              </p>
              <Link href="/states" className="font-display font-bold text-primary">
                See all states as a list →
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
