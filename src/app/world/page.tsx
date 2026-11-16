"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, Globe2, Landmark, Puzzle, Search, Users, Volume2 } from "lucide-react";
import MapView, { type RegionMark } from "@/components/MapView";
import { GoogleMapFrame, MapModeSwitch, type MapMode } from "@/components/RealMap";
import { MascotSays } from "@/components/Mascot";
import { Card, Chip, LinkButton, Loading, PageHeader, ShowMore } from "@/components/ui";
import { STATE_FILLS, useWorldMap, type RegionFeature } from "@/lib/geo";
import { actions } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { CONTINENTS, continentColour, COUNTRIES, countryName, flagOf, getCountry, isCountry, peopleText, type Continent } from "@/lib/world";

const describe = (id: string) => {
  const c = getCountry(id)!;
  const parts = [`${c.name}.`];
  if (c.name !== c.continent) parts.push(`It is in ${c.continent}${c.kind === "Dependency" ? `, and is part of ${c.sovereign}` : ""}.`);
  if (c.capitals.length) parts.push(`${c.capitals.length > 1 ? "Its capitals are" : "Its capital is"} ${c.capitals.join(" and ")}.`);
  parts.push(`People: ${peopleText(c)}.`);
  parts.push(
    c.neighbours.length
      ? `Its neighbours are ${c.neighbours.map((n) => countryName(n)).join(", ")}.`
      : "It has no land neighbours. There is only sea all around.",
  );
  return parts.join(" ").replace(/\.\./g, ".");
};

export default function WorldPage() {
  const { features, error } = useWorldMap();
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [colourBy, setColourBy] = useState<"country" | "continent">("continent");
  const [mapMode, setMapMode] = useState<MapMode>("drawn");
  const [continent, setContinent] = useState<Continent | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.capitals.some((k) => k.toLowerCase().includes(q))).slice(0, 6);
  }, [query]);

  const select = (id: string) => {
    setSelected(id);
    setQuery("");
    actions.exploreCountry(id);
    speak(describe(id));
    if (window.innerWidth < 1024) window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const c = selected ? getCountry(selected) : null;
  const fill = (f: RegionFeature) => {
    const country = getCountry(f.properties.id);
    if (f.properties.id === "in") return "#ff8b5c";
    return colourBy === "continent" && country ? continentColour(country.continent) : STATE_FILLS[f.properties.c];
  };
  const marks: Record<string, RegionMark | undefined> = {};
  if (continent && features) features.forEach((f) => getCountry(f.properties.id)?.continent !== continent && (marks[f.properties.id] = "dim"));

  const counts = useMemo(
    () => Object.fromEntries(CONTINENTS.map((k) => [k.id, COUNTRIES.filter((x) => x.continent === k.id && isCountry(x)).length])),
    [],
  );

  return (
    <div>
      <PageHeader back="/"  title="Explore the World" subtitle="India is orange. Tap any country to visit it!">
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:flex-nowrap xl:justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a country or capital…"
              aria-label="Search countries"
              className="w-full rounded-2xl border-2 border-line bg-white py-3 pl-11 pr-4 text-lg outline-none focus:border-primary"
            />
            {matches.length > 0 && (
              <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => select(m.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary-soft">
                      <span className="font-display text-lg font-semibold">
                        <span aria-hidden className="mr-2">{flagOf(m)}</span>
                        {m.name}
                      </span>
                      <span className="truncate text-sm text-ink-soft">{m.capitals[0]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <MapModeSwitch mode={mapMode} onChange={setMapMode} />
          {mapMode === "drawn" && (
            <div className="flex rounded-2xl bg-white p-1 shadow-[var(--shadow-card)]">
              {(["continent", "country"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setColourBy(k)}
                  className={`rounded-xl px-4 py-2 font-display font-semibold ${colourBy === k ? "bg-primary text-white" : "text-ink-soft"}`}
                >
                  {k === "continent" ? "By continent" : "Colourful"}
                </button>
              ))}
            </div>
          )}
        </div>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        {CONTINENTS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => {
              const next = continent === k.id ? null : k.id;
              setContinent(next);
              if (next) speak(`${k.id}. ${k.blurb}`);
            }}
            aria-pressed={continent === k.id}
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-display font-semibold transition ${
              continent === k.id ? "bg-ink text-white" : "bg-white text-ink-soft hover:bg-primary-soft"
            }`}
          >
            <span className="size-3 rounded-full" style={{ background: k.colour }} />
            {k.id}
            {k.id !== "Antarctica" && <span className="text-xs opacity-70">{counts[k.id]}</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          {mapMode === "google" ? (
            <GoogleMapFrame query={c ? c.name : "World"} zoom={c ? (c.pop > 1e8 ? 3 : 5) : 2} title="Google Map of the world" />
          ) : error ? (
            <Card>Couldn&apos;t load the world map. Please check your connection and try again.</Card>
          ) : !features ? (
            <Loading label="Spinning the globe…" />
          ) : (
            <MapView
              features={features}
              projection="world"
              tinyArea={4}
              fillFor={fill}
              marks={marks}
              selectedId={selected}
              onSelect={select}
              onHover={setHover}
              focusId={selected}
              labelFor={(f) => countryName(f.properties.id)}
              nameFor={(f) => countryName(f.properties.id)}
              ariaLabel="World map of countries"
              maxHeight="72vh"
              overlay={
                hover && hover !== selected ? (
                  <div className="pointer-events-none absolute bottom-3 left-3 rounded-2xl bg-white/95 px-4 py-2 font-display text-lg font-bold shadow-[var(--shadow-card)]">
                    {getCountry(hover) && flagOf(getCountry(hover)!)} {countryName(hover)}
                  </div>
                ) : null
              }
            />
          )}
          <p className="mt-2 text-sm text-ink-soft">Tiny island countries have a dot. Pinch or use + to zoom in.</p>
        </div>

        <div ref={panelRef} className="scroll-mt-20 space-y-4">
          {c ? (
            <Card className="animate-pop space-y-4" key={c.id}>
              <div className="flex items-start gap-3">
                <span className="text-5xl leading-none" aria-hidden>
                  {flagOf(c)}
                </span>
                <div className="min-w-0 flex-1">
                  {c.continent !== c.name && (
                    <Chip className="bg-primary-soft text-primary">
                      {c.continent}
                      {c.kind === "Dependency" ? ` · part of ${c.sovereign}` : ""}
                    </Chip>
                  )}
                  <h2 className="mt-1 text-3xl font-extrabold leading-tight">{c.name}</h2>
                  {c.subregion !== c.name && c.subregion !== c.continent && <p className="text-sm text-ink-soft">{c.subregion}</p>}
                </div>
                <button
                  type="button"
                  aria-label="Listen again"
                  data-no-announce
                  title="Listen again"
                  onClick={() => speak(describe(c.id), { force: true })}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white shadow-[0_3px_0_#2450bd]"
                >
                  <Volume2 className="size-5" />
                </button>
              </div>
              <dl className="space-y-3 text-lg">
                {c.capitals.length > 0 && (
                  <div className="flex gap-3">
                    <Landmark className="mt-1 size-5 shrink-0 text-primary" />
                    <div>
                      <dt className="text-sm font-bold text-ink-soft">{c.capitals.length > 1 ? "Capitals" : "Capital"}</dt>
                      <dd className="font-semibold">{c.capitals.join(", ")}</dd>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Globe2 className="mt-1 size-5 shrink-0 text-success" />
                  <div>
                    <dt className="text-sm font-bold text-ink-soft">People</dt>
                    <dd className="font-semibold">{peopleText(c)}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="mt-1 size-5 shrink-0 text-accent" />
                  <div>
                    <dt className="text-sm font-bold text-ink-soft">Neighbours</dt>
                    <dd className="pt-1">
                      {c.neighbours.length ? (
                        <ShowMore
                          items={c.neighbours}
                          initial={6}
                          noun="neighbours"
                          className="flex flex-wrap gap-1.5"
                          render={(n) => (
                            <button key={n} type="button" onClick={() => select(n)} className="rounded-full bg-bg px-3 py-1 text-sm font-bold hover:bg-primary-soft">
                              {countryName(n)}
                            </button>
                          )}
                        />
                      ) : (
                        <span className="text-base text-ink-soft">No land neighbours — only sea all around!</span>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
              {c.id === "in" && (
                <LinkButton href="/explore">
                  Explore India&apos;s states <ArrowRight className="size-5" />
                </LinkButton>
              )}
            </Card>
          ) : (
            <Card className="space-y-3">
              <MascotSays say>Let&apos;s travel the world! Tap any country, or pick a continent.</MascotSays>
              <p className="text-ink-soft">
                There are <b>7 continents</b>. India is in <b>Asia</b>, the biggest one.
              </p>
            </Card>
          )}
          <Card className="space-y-2">
            <p className="font-display text-lg font-bold">Play with the world</p>
            <Link href="/games/identify-country" className="flex items-center gap-2 rounded-2xl bg-bg px-4 py-3 font-semibold hover:bg-primary-soft">
              <Globe2 className="size-5 text-primary" /> Identify the Country
            </Link>
            <Link href="/puzzle#world" className="flex items-center gap-2 rounded-2xl bg-bg px-4 py-3 font-semibold hover:bg-primary-soft">
              <Puzzle className="size-5 text-accent" /> Continent puzzles
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
