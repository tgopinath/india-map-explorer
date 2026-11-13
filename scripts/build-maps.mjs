// Builds the app's map data from verified LGD boundary files.
//
//   Source: Local Government Directory (LGD) / BharatMaps boundaries, as packaged by
//   github.com/ramSeraph/indian_admin_boundaries (releases "states" and "districts", CC0,
//   attribute datameet and the original government source).
//
// Input : data-raw/LGD_States.geojsonl, data-raw/LGD_Districts.geojsonl
// Output: public/data/india.topo.json                 (36 states/UTs)
//         public/data/districts/<state-id>.topo.json  (one per state/UT)
//         src/data/generated/geo-index.json           (counts, neighbours, district lists)
//
// Geometry is only ever simplified, never edited or invented.

import fs from "node:fs";
import path from "node:path";
import mapshaper from "mapshaper";
import * as topojson from "topojson-client";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const RAW = path.join(ROOT, "data-raw");
const OUT = path.join(ROOT, "public/data");
const GEN = path.join(ROOT, "src/data/generated");

const states = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/states.json"), "utf8")).states;
const byLgd = new Map(states.map((s) => [s.lgd, s]));

const readLines = (f) =>
  fs.readFileSync(path.join(RAW, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

const slug = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

async function toTopo(fc, cmd) {
  const out = await mapshaper.applyCommands(`-i in.json ${cmd} -o out.json format=topojson`, {
    "in.json": JSON.stringify(fc),
  });
  return JSON.parse(out["out.json"]);
}

// Greedy colouring so neighbours never share a colour. Returns index per geometry.
function colour(neigh, paletteSize) {
  const order = neigh.map((n, i) => i).sort((a, b) => neigh[b].length - neigh[a].length);
  const c = new Array(neigh.length).fill(-1);
  for (const i of order) {
    const used = new Set(neigh[i].map((j) => c[j]));
    let k = i % paletteSize;
    for (let t = 0; t < paletteSize && used.has(k); t++) k = (k + 1) % paletteSize;
    c[i] = k;
  }
  return c;
}

fs.mkdirSync(path.join(OUT, "districts"), { recursive: true });
fs.mkdirSync(GEN, { recursive: true });

// ---------- States ----------
const rawStates = readLines("LGD_States.geojsonl");
if (rawStates.length !== 36) throw new Error(`Expected 36 states/UTs, got ${rawStates.length}`);

const stateFc = {
  type: "FeatureCollection",
  features: rawStates.map((f) => {
    const meta = byLgd.get(f.properties.State_LGD);
    if (!meta) throw new Error(`No metadata for state LGD ${f.properties.State_LGD} ${f.properties.STNAME}`);
    return { type: "Feature", geometry: f.geometry, properties: { id: meta.id, lgd: meta.lgd, name: meta.name } };
  }),
};

const STATE_CMD = [
  "-snap interval=0.002",
  "-simplify 1.2% weighted keep-shapes",
  "-clean",
  "-each 'lx=+this.innerX.toFixed(4), ly=+this.innerY.toFixed(4)'",
  "-rename-layers states",
  "-o quantization=40000",
].join(" ");
const indiaTopo = await toTopo(stateFc, STATE_CMD);
const sGeoms = indiaTopo.objects.states.geometries;
// Shared arcs catch most borders. Enclaves (e.g. Yanam inside Andhra Pradesh) whose
// source edges don't line up are caught by checking for raw vertices sharing a ~300 m grid cell.
const sNeigh = topojson.neighbors(sGeoms).map((n) => new Set(n));
{
  const CELL = 0.003;
  const cells = new Map();
  const walk = (c, fn) => (typeof c[0] === "number" ? fn(c) : c.forEach((x) => walk(x, fn)));
  rawStates.forEach((f) => {
    const gi = sGeoms.findIndex((g) => g.properties.lgd === f.properties.State_LGD);
    walk(f.geometry.coordinates, ([x, y]) => {
      const k = `${Math.round(x / CELL)},${Math.round(y / CELL)}`;
      if (!cells.has(k)) cells.set(k, new Set());
      cells.get(k).add(gi);
    });
  });
  for (const set of cells.values()) {
    if (set.size < 2) continue;
    for (const a of set) for (const b of set) if (a !== b) sNeigh[a].add(b);
  }
}
const sNeighArr = sNeigh.map((s) => [...s]);
const sColour = colour(sNeighArr, 8);
sGeoms.forEach((g, i) => {
  g.id = g.properties.id;
  g.properties.c = sColour[i];
});

// ---------- Districts ----------
const rawDistricts = readLines("LGD_Districts.geojsonl");
// States whose district list and boundaries have been checked by hand against the
// state government's current list. Everything else is shown as an LGD snapshot.
const VERIFIED = new Set(["tamil-nadu"]);
// Known changes after the Dec 2023 LGD snapshot, shown to users as warnings.
const KNOWN_CHANGES = {
  rajasthan: "Rajasthan abolished 9 of these districts in December 2024; this snapshot predates that.",
};
const index = { source: "LGD / BharatMaps via ramSeraph/indian_admin_boundaries (CC0)", builtOn: new Date().toISOString().slice(0, 10), states: {} };

for (const s of states) {
  const feats = rawDistricts.filter((f) => f.properties.state_lgd === s.lgd);
  if (!feats.length) throw new Error(`No districts for ${s.name}`);
  const used = new Set();
  const fc = {
    type: "FeatureCollection",
    features: feats.map((f) => {
      const lgdName = (f.properties.dtname || f.properties.Dist).trim();
      let id = slug(lgdName);
      while (used.has(id)) id += "-2";
      used.add(id);
      return {
        type: "Feature",
        geometry: f.geometry,
        properties: { id, lgd: f.properties.dist_lgd, lgdName: /[a-z]/.test(lgdName) ? lgdName : titleCase(lgdName) },
      };
    }),
  };
  // Bigger states need more simplification; small UTs keep more detail.
  const pct = feats.length > 40 ? "3%" : feats.length > 15 ? "5%" : "12%";
  const topo = await toTopo(
    fc,
    [
      "-snap interval=0.0008",
      `-simplify ${pct} weighted keep-shapes`,
      "-clean",
      "-each 'lx=+this.innerX.toFixed(4), ly=+this.innerY.toFixed(4)'",
      "-rename-layers districts",
      "-o quantization=30000",
    ].join(" "),
  );
  const geoms = topo.objects.districts.geometries;
  const neigh = topojson.neighbors(geoms);
  const col = colour(neigh, 6);
  geoms.forEach((g, i) => {
    g.id = g.properties.id;
    g.properties.c = col[i];
  });
  fs.writeFileSync(path.join(OUT, "districts", `${s.id}.topo.json`), JSON.stringify(topo));

  // Integrity checks: nothing dropped, and districts don't overlap (sum of district
  // areas should match the state area from the state layer).
  const issues = [];
  if (geoms.length !== feats.length) issues.push(`${feats.length - geoms.length} district shape(s) could not be used`);
  const stateArea = rawStates.find((f) => f.properties.State_LGD === s.lgd).properties.Shape_Area;
  const distArea = feats.reduce((a, f) => a + (f.properties.SHAPE_Area || 0), 0);
  const ratio = distArea / stateArea;
  if (ratio > 1.03) issues.push(`district shapes overlap (${Math.round((ratio - 1) * 100)}% extra area)`);
  if (KNOWN_CHANGES[s.id]) issues.push(KNOWN_CHANGES[s.id]);
  const dataStatus = issues.length ? "issues" : VERIFIED.has(s.id) ? "verified" : "snapshot";

  const si = sGeoms.findIndex((g) => g.id === s.id);
  index.states[s.id] = {
    districtCount: geoms.length,
    dataStatus,
    issues,
    areaRatio: +ratio.toFixed(3),
    neighbours: sNeighArr[si].map((j) => sGeoms[j].id).sort(),
    districts: geoms
      .map((g, i) => ({ id: g.id, lgd: g.properties.lgd, lgdName: g.properties.lgdName, neighbours: neigh[i].map((j) => geoms[j].id) }))
      .sort((a, b) => a.lgdName.localeCompare(b.lgdName)),
  };
}

fs.writeFileSync(path.join(OUT, "india.topo.json"), JSON.stringify(indiaTopo));
fs.writeFileSync(path.join(GEN, "geo-index.json"), JSON.stringify(index, null, 1));

// ---------- Validation ----------
const tn = index.states["tamil-nadu"];
const tnContent = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/districts/tamil-nadu.json"), "utf8")).districts;
const tnLgd = new Set(tn.districts.map((d) => String(d.lgd)));
const missing = Object.keys(tnContent).filter((k) => !tnLgd.has(k));
const uncovered = [...tnLgd].filter((k) => !tnContent[k]);
if (tn.dataStatus !== "verified" || tn.districtCount !== 38 || missing.length || uncovered.length)
  throw new Error(`Tamil Nadu check failed: count=${tn.districtCount} missing=${missing} uncovered=${uncovered}`);

const total = Object.values(index.states).reduce((a, s) => a + s.districtCount, 0);
const size = (f) => (fs.statSync(f).size / 1024).toFixed(0) + " KB";
console.log(`States: ${sGeoms.length}, districts: ${total}`);
console.log(`india.topo.json ${size(path.join(OUT, "india.topo.json"))}; tamil-nadu ${size(path.join(OUT, "districts/tamil-nadu.topo.json"))}`);
console.log("Tamil Nadu neighbours:", tn.neighbours.join(", "));
for (const [id, st] of Object.entries(index.states)) if (st.dataStatus !== "snapshot") console.log(`  ${id}: ${st.dataStatus} ${st.areaRatio} ${st.issues.join("; ")}`);
