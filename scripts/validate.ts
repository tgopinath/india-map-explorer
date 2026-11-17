// Data and game checks: run with `npm run validate`.
// Fails loudly if map data, content and game logic drift apart.

import fs from "node:fs";
import path from "node:path";
import { feature } from "topojson-client";
import { getDistricts, getState, PILOT_STATE, STATES } from "../src/lib/content";
import { CONTINENT_BOX, CONTINENTS, COUNTRIES, getCountry } from "../src/lib/world";
import { CLOTHING, FEATURED, FESTIVALS, FOODS, GREETINGS, LANDMARKS, mediaFor } from "../src/lib/explorer";
import {
  continentQs, identifyCountryQs, dailyQs, findCountryQs, flagQuizQs, foodExplorerQs, landmarkDetectiveQs, worldCapitalQs,
  capitalMcqQs, districtMcqQs, districtTapQs, findCapitalQs, identifyStateQs, neighbourMcqQs, type Question,
} from "../src/lib/questions";

let failures = 0;
const check = (ok: unknown, msg: string) => {
  if (!ok) {
    failures++;
    console.error("✗", msg);
  }
};
const ROOT = path.resolve(import.meta.dirname, "..");

// 1. India: 28 states + 8 UTs, each with boundary, capital, languages.
check(STATES.filter((s) => s.type === "state").length === 28, "expected 28 states");
check(STATES.filter((s) => s.type === "ut").length === 8, "expected 8 Union Territories");
const india = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/india.topo.json"), "utf8"));
const indiaIds = new Set(india.objects.states.geometries.map((g: { id: string }) => g.id));
for (const s of STATES) {
  check(indiaIds.has(s.id), `${s.id}: missing from india.topo.json`);
  check(s.capital && s.languages.length && s.famousPlaces.length && s.facts.length, `${s.id}: incomplete content`);
  for (const n of s.neighbours) check(getState(n)?.neighbours.includes(s.id), `${s.id}↔${n}: neighbour list not symmetric`);
}

// 2. Known borders (independent of the data) must come out of the geometry.
const KNOWN: [string, string[]][] = [
  ["tamil-nadu", ["andhra-pradesh", "karnataka", "kerala", "puducherry"]],
  ["kerala", ["karnataka", "puducherry", "tamil-nadu"]],
  ["telangana", ["andhra-pradesh", "chhattisgarh", "karnataka", "maharashtra"]],
  ["goa", ["karnataka", "maharashtra"]],
  ["sikkim", ["west-bengal"]],
  ["meghalaya", ["assam"]],
  ["lakshadweep", []],
  ["andaman-and-nicobar-islands", []],
];
for (const [id, want] of KNOWN) check(JSON.stringify(getState(id)!.neighbours) === JSON.stringify(want), `${id}: neighbours ${getState(id)!.neighbours} ≠ ${want}`);

// 3. Every state's district file matches the index and has a valid label point.
for (const s of STATES) {
  const topo = JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/districts/${s.id}.topo.json`), "utf8"));
  const fc = feature(topo, topo.objects.districts) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { id: string; lx: number; ly: number }>;
  const ids = fc.features.map((f) => f.properties.id);
  check(ids.length === s.districtCount, `${s.id}: ${ids.length} shapes vs ${s.districtCount} in index`);
  check(new Set(ids).size === ids.length, `${s.id}: duplicate district ids`);
  const ds = getDistricts(s.id);
  check(ds.length === ids.length && ds.every((d) => ids.includes(d.id)), `${s.id}: district list doesn't match shapes`);
  for (const f of fc.features) check(Number.isFinite(f.properties.lx) && Number.isFinite(f.properties.ly), `${s.id}/${f.properties.id}: bad label point`);
}

// 4. Tamil Nadu pilot: all 38 official districts, all curated.
const TN_OFFICIAL = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi",
  "Kancheepuram", "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal",
  "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "The Nilgiris",
  "Theni", "Thiruvallur", "Thiruvarur", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur",
  "Tiruvannamalai", "Vellore", "Viluppuram", "Virudhunagar",
];
const tn = getDistricts(PILOT_STATE);
check(getState(PILOT_STATE)!.dataStatus === "verified", "Tamil Nadu should be verified");
check(JSON.stringify(tn.map((d) => d.name).sort()) === JSON.stringify([...TN_OFFICIAL].sort()), `Tamil Nadu names differ: ${tn.map((d) => d.name).filter((n) => !TN_OFFICIAL.includes(n))}`);
check(tn.every((d) => d.curated && d.headquarters && d.fact), "every Tamil Nadu district needs headquarters + fact");

// 5. Game logic: many random rounds, every question must be well-formed.
const validate = (q: Question, label: string) => {
  if (q.kind === "mcq") {
    check(q.options.length >= 3 && q.options.length <= 4, `${label} ${q.id}: ${q.options.length} options`);
    check(new Set(q.options).size === q.options.length, `${label} ${q.id}: duplicate options ${q.options}`);
    check(q.options.filter((o) => o === q.answer).length === 1, `${label} ${q.id}: answer not exactly once`);
  } else {
    check(q.map === "india" ? indiaIds.has(q.answer) : true, `${label} ${q.id}: tap answer not on map`);
  }
};
for (let i = 0; i < 200; i++) {
  identifyStateQs().forEach((q) => validate(q, "identify"));
  capitalMcqQs().forEach((q) => validate(q, "capital"));
  neighbourMcqQs().forEach((q) => validate(q, "neighbour"));
  findCapitalQs().forEach((q) => validate(q, "find-capital"));
}
for (const s of STATES.filter((x) => x.districtCount >= 4)) {
  for (let i = 0; i < 20; i++) {
    districtMcqQs(s.id).forEach((q) => validate(q, `district-mcq ${s.id}`));
    districtTapQs(s.id).forEach((q) => validate(q, `district-tap ${s.id}`));
  }
}

// 6. World map: every country has a shape; India uses the official outline and its
// neighbours match India's official map; continent puzzles have countries.
const world = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/world.topo.json"), "utf8"));
const worldIds = new Set(world.objects.countries.geometries.map((g: { id: string }) => g.id));
check(COUNTRIES.every((c) => worldIds.has(c.id)), "world: country without a shape");
check(JSON.stringify(getCountry("in")?.neighbours) === JSON.stringify(["af", "bd", "bt", "cn", "mm", "np", "pk"]), `world: India neighbours ${getCountry("in")?.neighbours}`);
check(getCountry("in")?.capitals[0] === "New Delhi", "world: India capital");
for (const k of CONTINENTS) if (CONTINENT_BOX[k.id]) check(COUNTRIES.filter((c) => c.continent === k.id).length >= 10, `world: ${k.id} puzzle too small`);
for (const [id, cap] of [["fr", "Paris"], ["jp", "Tokyo"], ["kz", "Astana"], ["lk", "Sri Jayawardenepura Kotte"], ["au", "Canberra"]] as const)
  check(getCountry(id)?.capitals.includes(cap), `world: ${id} capital should include ${cap}`);
for (let i = 0; i < 200; i++) {
  identifyCountryQs().forEach((q) => validate(q, "country"));
  continentQs().forEach((q) => validate(q, "continent"));
}

// 7. World Explorer content: every item points at a real country, landmarks have a photo,
// a credit and coordinates; games produce valid questions at every level.
for (const l of LANDMARKS) {
  check(getCountry(l.country), `landmark ${l.id}: unknown country ${l.country}`);
  const m = mediaFor(l.id);
  check(m?.coords, `landmark ${l.id}: no coordinates`);
  check(m?.image && m.credit, `landmark ${l.id}: no credited photo`);
}
for (const f of [...FOODS, ...CLOTHING]) check(getCountry(f.country), `${f.id}: unknown country ${f.country}`);
for (const f of FESTIVALS) check(f.country === null || getCountry(f.country), `${f.id}: unknown country`);
for (const g of GREETINGS) check(getCountry(g.country) && /^[a-z]{2}-[A-Z]{2}$/.test(g.voice), `greeting ${g.id}`);
for (const id of FEATURED) check(getCountry(id), `profile ${id}: unknown country`);
for (const level of ["beginner", "intermediate", "advanced"] as const) {
  for (let i = 0; i < 40; i++) {
    worldCapitalQs(level).forEach((q) => validate(q, `wcap-${level}`));
    landmarkDetectiveQs(level).forEach((q) => validate(q, `ld-${level}`));
    foodExplorerQs(level).forEach((q) => validate(q, `fe-${level}`));
    flagQuizQs(level).forEach((q) => validate(q, `flag-${level}`));
    findCountryQs(level).forEach((q) => validate(q, `find-${level}`));
  }
}
const d1 = JSON.stringify(dailyQs("2026-11-17"));
check(d1 === JSON.stringify(dailyQs("2026-11-17")), "daily challenge is not the same for everyone on a day");
check(d1 !== JSON.stringify(dailyQs("2026-11-18")), "daily challenge does not change between days");
if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log(`✓ all checks passed — ${COUNTRIES.length} world regions, ${STATES.length} states/UTs, ${STATES.reduce((a, s) => a + s.districtCount, 0)} districts, Tamil Nadu verified (${tn.length})`);
