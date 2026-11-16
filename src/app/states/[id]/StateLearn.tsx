"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Camera, Landmark, Languages, Lightbulb, Map as MapIcon, Puzzle, Users } from "lucide-react";
import MapView from "@/components/MapView";
import { MascotSays } from "@/components/Mascot";
import { Card, Chip, DataStatusBadge, LinkButton, Loading, ShowMore } from "@/components/ui";
import { getState, REGION_COLOURS, stateName } from "@/lib/content";
import { useDistrictMap } from "@/lib/geo";
import { actions } from "@/lib/progress";

export default function StateLearn({ id }: { id: string }) {
  const s = getState(id)!;
  const { features } = useDistrictMap(id);
  useEffect(() => actions.viewState(id), [id]);
  const tint = REGION_COLOURS[s.region];

  return (
    <div className="space-y-5">
      <Link href="/states" className="inline-flex items-center gap-1 font-display font-bold text-primary">
        <ArrowLeft className="size-5" /> All states
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div>
          {features ? (
            <MapView
              features={features}
              fillFor={() => tint}
              labelMode="none"
              nameFor={(f) => f.properties.lgdName ?? ""}
              ariaLabel={`Map of ${s.name}`}
              zoomable
              maxHeight="62vh"
            />
          ) : (
            <Loading />
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <DataStatusBadge status={s.dataStatus} issues={s.issues} />
            <span>Thin white lines are district borders.</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Chip className={s.type === "ut" ? "bg-accent-soft text-[#b4471c]" : "bg-primary-soft text-primary"}>
              {s.type === "ut" ? "Union Territory" : "State"} · {s.region} India
            </Chip>
            <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{s.name}</h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Fact icon={Landmark} label="Capital" value={s.capital} colour="text-primary" />
            <Fact icon={MapIcon} label="Districts" value={String(s.districtCount)} colour="text-success" />
            <Fact icon={Languages} label="Official languages" value={s.languages.join(", ")} colour="text-[#7b55e0]" wide />
          </div>

          <Card className="space-y-2">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Users className="size-5 text-accent" /> Neighbours
            </h2>
            <div className="flex flex-wrap gap-2">
              {s.neighbours.length ? (
                s.neighbours.map((n) => (
                  <Link key={n} href={`/states/${n}`} className="rounded-full bg-bg px-3 py-1.5 font-semibold hover:bg-primary-soft">
                    {stateName(n)}
                  </Link>
                ))
              ) : (
                <p className="text-ink-soft">No land neighbours in India — only the sea!</p>
              )}
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <LinkButton href={`/districts/${s.id}`}>
              Explore Districts <ArrowRight className="size-5" />
            </LinkButton>
            <LinkButton href={`/puzzle/${s.id}`} tone="white">
              <Puzzle className="size-5" /> District puzzle
            </LinkButton>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold">
            <Camera className="size-6 text-primary" /> Famous places
          </h2>
          <ShowMore
            as="ul"
            items={s.famousPlaces}
            initial={3}
            noun="places"
            className="grid gap-2"
            render={(p) => (
              <li key={p} className="flex items-center gap-3 rounded-2xl bg-bg px-4 py-3 text-lg font-semibold">
                <span className="size-2.5 shrink-0 rounded-full bg-secondary" />
                {p}
              </li>
            )}
          />
        </Card>
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold">
            <Lightbulb className="size-6 text-[#e5a100]" /> Did you know?
          </h2>
          <ShowMore
            items={s.facts}
            initial={1}
            noun="facts"
            className="space-y-3"
            render={(f, i) => (
              <MascotSays key={i} mood={i % 2 ? "think" : "happy"} size={56}>
                {f}
              </MascotSays>
            )}
          />
        </Card>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value, colour, wide }: { icon: typeof Landmark; label: string; value: string; colour: string; wide?: boolean }) {
  return (
    <div className={`rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ${wide ? "col-span-2" : ""}`}>
      <p className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
        <Icon className={`size-4 ${colour}`} /> {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold leading-snug">{value}</p>
    </div>
  );
}
