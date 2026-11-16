"use client";

import { useMemo } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { RegionFeature } from "@/lib/geo";

const W = 100;
const H = 112;
const cache = new WeakMap<RegionFeature[], { outline: string; byId: Map<string, { d: string; x: number; y: number; tiny: boolean }> }>();

function project(features: RegionFeature[]) {
  const hit = cache.get(features);
  if (hit) return hit;
  const fc = { type: "FeatureCollection" as const, features };
  const projection = geoMercator().fitExtent([[3, 3], [W - 3, H - 3]], fc);
  const path = geoPath(projection);
  const byId = new Map<string, { d: string; x: number; y: number; tiny: boolean }>();
  for (const f of features) {
    const [x, y] = projection([f.properties.lx, f.properties.ly]) ?? [0, 0];
    byId.set(f.properties.id, { d: path(f) ?? "", x, y, tiny: path.area(f) < 6 });
  }
  const result = { outline: [...byId.values()].map((v) => v.d).join(""), byId };
  cache.set(features, result);
  return result;
}

/** Draw once per page; every StateLocator reuses this outline of India. */
export function IndiaOutlineDefs({ features }: { features: RegionFeature[] }) {
  const { outline } = useMemo(() => project(features), [features]);
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <path id="imx-india-outline" d={outline} />
      </defs>
    </svg>
  );
}

/** A small map of India with one state or UT highlighted, so children can see where it is. */
export function StateLocator({ id, features, colour, size = 84 }: { id: string; features: RegionFeature[]; colour: string; size?: number }) {
  const { byId } = useMemo(() => project(features), [features]);
  const s = byId.get(id);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={size} height={(size * H) / W} aria-hidden className="shrink-0">
      <use href="#imx-india-outline" fill="#ffffff" stroke="#c3cde0" strokeWidth={0.35} />
      {s && <path d={s.d} fill={colour} stroke="#1f2a44" strokeWidth={0.6} strokeLinejoin="round" />}
      {s?.tiny && (
        <>
          <circle cx={s.x} cy={s.y} r={6} fill="none" stroke="#ff8b5c" strokeWidth={1.6} />
          <circle cx={s.x} cy={s.y} r={2.4} fill="#ff8b5c" />
        </>
      )}
    </svg>
  );
}
