// Builds the world map from Natural Earth (public domain), India point-of-view edition.
//
// Input : data-raw/world/ne_10m_admin_0_countries_ind.geojson
//         data-raw/world/ne_10m_populated_places_simple.geojson   (capitals: adm0cap = 1)
//         data-raw/LGD_States.geojsonl                            (official India outline)
// Output: public/data/world.topo.json
//         src/data/generated/world-index.json
//
// India is drawn from the same official LGD boundary the rest of the app uses, and
// neighbouring shapes are trimmed so nothing overlaps it. Geometry is only simplified.

import fs from "node:fs";
import path from "node:path";
import mapshaper from "mapshaper";
import * as topojson from "topojson-client";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const RAW = path.join(ROOT, "data-raw");
const read = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8"));

const ne = read("world/ne_10m_admin_0_countries_ind.geojson");
const places = read("world/ne_10m_populated_places_simple.geojson");
const lgdStates = fs.readFileSync(path.join(RAW, "LGD_States.geojsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

// Tiny or technical areas that would only clutter a children's map.
const SKIP = new Set(["IND", "BRI", "BRT", "PGA", "SCR", "USG", "ESB", "WSB", "CSI", "ATC", "CLP", "IOT", "KAB"]);

const CONTINENT_FIX = { "Seven seas (open ocean)": null };
const continentOf = (p) => CONTINENT_FIX[p.CONTINENT] === null ? (p.REGION_UN === "Americas" ? "South America" : p.REGION_UN) : p.CONTINENT;
const nameOf = (p) => (p.NAME.includes(".") ? p.NAME_LONG : p.NAME);
const iso2Of = (p) => [p.ISO_A2, p.ISO_A2_EH].find((x) => x && x !== "-99") ?? null;

// Capitals keyed by ISO code (falls back to ADM0 code). National capitals for countries;
// territory capitals ("Admin-0 region capital") only for dependencies.
const official = new Map(); // adm0cap = 1
const fallback = new Map(); // "Admin-0 capital" without the flag (e.g. Juba)
const regionCapitals = new Map();
for (const f of places.features) {
  const p = f.properties;
  const key = p.iso_a2 && p.iso_a2 !== "-99" ? p.iso_a2 : p.adm0_a3;
  const target = p.adm0cap === 1 ? official : p.featurecla === "Admin-0 capital" ? fallback : p.featurecla === "Admin-0 region capital" ? regionCapitals : null;
  if (!target) continue;
  target.set(key, [...new Set([...(target.get(key) ?? []), p.name])]);
}
// Capitals whose status is disputed internationally are left blank for children.
const DISPUTED_CAPITAL = new Set(["PSX", "ISR"]);
// Corrections where Natural Earth's capital flag is out of date or names the main city.
const CAPITAL_FIX = {
  KAZ: ["Astana"], // renamed back from Nur-Sultan in 2022
  TZA: ["Dodoma"], // official capital; Dar es Salaam is the largest city
  LKA: ["Sri Jayawardenepura Kotte"], // official capital; Colombo is the largest city
  CIV: ["Yamoussoukro"], // official capital; Abidjan is the largest city
};
const capitalsFor = (props) => {
  if (DISPUTED_CAPITAL.has(props.a3)) return [];
  if (CAPITAL_FIX[props.a3]) return CAPITAL_FIX[props.a3];
  const key = props.iso2 ?? props.a3;
  return official.get(key) ?? fallback.get(key) ?? (props.kind === "Dependency" ? regionCapitals.get(key) ?? [] : []);
};

const used = new Set();
const others = ne.features
  .filter((f) => !SKIP.has(f.properties.ADM0_A3))
  .map((f) => {
    const p = f.properties;
    let id = (iso2Of(p) ?? p.ADM0_A3).toLowerCase();
    if (used.has(id)) id = p.ADM0_A3.toLowerCase();
    used.add(id);
    return {
      type: "Feature",
      geometry: f.geometry,
      properties: {
        id,
        a3: p.ADM0_A3,
        name: nameOf(p),
        iso2: iso2Of(p),
        continent: continentOf(p),
        subregion: p.SUBREGION,
        pop: p.POP_EST,
        kind: p.TYPE,
        sovereign: p.SOVEREIGNT,
      },
    };
  });

const india = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "GeometryCollection", geometries: lgdStates.map((f) => f.geometry) },
      properties: {},
    },
  ],
};
const indPop = ne.features.find((f) => f.properties.ADM0_A3 === "IND").properties.POP_EST;

// 1) official India outline, 2) other countries with India erased, 3) merge + simplify.
const out = await mapshaper.applyCommands(
  [
    "-i india.json name=india",
    "-dissolve",
    "-each \"id='in', a3='IND', name='India', iso2='IN', continent='Asia', subregion='Southern Asia', pop=" + indPop + ", kind='Sovereign country', sovereign='India'\"",
    "-i others.json name=others",
    "-erase india target=others",
    "-merge-layers target=india,others name=countries force",
    "-snap interval=0.01",
    "-simplify 1.2% weighted keep-shapes",
    "-clean",
    "-filter-islands min-area=8km2 remove-empty",
    "-each 'lx=+this.innerX.toFixed(3), ly=+this.innerY.toFixed(3)'",
    "-o out.json format=topojson quantization=60000",
  ].join(" "),
  { "india.json": JSON.stringify(india), "others.json": JSON.stringify({ type: "FeatureCollection", features: others }) },
);
const topo = JSON.parse(out["out.json"]);
const geoms = topo.objects.countries.geometries;
const neigh = topojson.neighbors(geoms);

// Colour so that neighbours differ.
const order = geoms.map((_, i) => i).sort((a, b) => neigh[b].length - neigh[a].length);
const col = new Array(geoms.length).fill(-1);
for (const i of order) {
  const usedC = new Set(neigh[i].map((j) => col[j]));
  let k = i % 8;
  for (let t = 0; t < 8 && usedC.has(k); t++) k = (k + 1) % 8;
  col[i] = k;
}
geoms.forEach((g, i) => {
  g.id = g.properties.id;
  g.properties.c = col[i];
});

const index = {
  source: "Natural Earth 1:10m Admin 0 countries, India point of view (public domain); India outline from LGD",
  builtOn: new Date().toISOString().slice(0, 10),
  countries: geoms
    .map((g, i) => ({
      id: g.id,
      name: g.properties.name,
      iso2: g.properties.iso2,
      continent: g.properties.continent,
      subregion: g.properties.subregion,
      pop: g.properties.pop,
      kind: g.properties.kind,
      sovereign: g.properties.sovereign,
      capitals: capitalsFor(g.properties),
      neighbours: neigh[i].map((j) => geoms[j].id).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
};

fs.writeFileSync(path.join(ROOT, "public/data/world.topo.json"), JSON.stringify(topo));
fs.writeFileSync(path.join(ROOT, "src/data/generated/world-index.json"), JSON.stringify(index, null, 1));

const ind = index.countries.find((c) => c.id === "in");
console.log(`Countries: ${geoms.length}; world.topo.json ${(fs.statSync(path.join(ROOT, "public/data/world.topo.json")).size / 1024).toFixed(0)} KB`);
console.log("India neighbours:", ind.neighbours.join(", "), "| capital:", ind.capitals.join(", "));
console.log("No capital:", index.countries.filter((c) => !c.capitals.length).map((c) => c.name).join(", "));
const byCont = {};
index.countries.forEach((c) => (byCont[c.continent] = (byCont[c.continent] ?? 0) + 1));
console.log(byCont);
