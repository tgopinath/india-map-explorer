// Builds World Explorer data: `npm run build:explorer`
//
// 1. Photos + map coordinates for every landmark, food, outfit and festival in
//    src/data/explorer.json, from English Wikipedia (lead image and coordinates) and
//    Wikimedia Commons (artist and licence, so every photo is credited).
// 2. Languages, currencies, location and major cities for every country on the world map:
//    mledoze/countries (ODbL) and Natural Earth populated places (public domain).
//
// Output: src/data/generated/media.json, src/data/generated/countries-extra.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GEN = path.join(ROOT, "src/data/generated");
const UA = { "User-Agent": "IndiaMapExplorer/1.0 (children's geography app; build script)" };
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

const explorer = read("src/data/explorer.json");
const world = read("src/data/generated/world-index.json");

async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
  }
  throw new Error(`API failed: ${url}`);
}

const strip = (html) => (html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// ---------- 1. Media ----------
const items = ["landmarks", "foods", "clothing", "festivals"].flatMap((k) => explorer[k].map((x) => ({ kind: k, id: x.id, wiki: x.wiki, photoWiki: x.photoWiki })));
const media = {};
for (let i = 0; i < items.length; i += 20) {
  const batch = items.slice(i, i + 20);
  const res = await api("en.wikipedia.org", {
    action: "query",
    titles: batch.map((b) => b.wiki).join("|"),
    prop: "pageimages|coordinates|info",
    piprop: "thumbnail|name",
    pithumbsize: "800",
    inprop: "url",
    colimit: "max",
    coprimary: "all",
    pilimit: "max",
    redirects: "1",
  });
  const norm = new Map();
  for (const n of [...(res.query.normalized ?? []), ...(res.query.redirects ?? [])]) norm.set(n.from, n.to);
  const byTitle = new Map(res.query.pages.map((p) => [p.title, p]));
  for (const b of batch) {
    let t = b.wiki;
    for (let k = 0; k < 3 && norm.has(t); k++) t = norm.get(t);
    const p = byTitle.get(t);
    if (!p || p.missing) {
      console.warn("missing article:", b.wiki);
      continue;
    }
    media[b.id] = {
      article: p.fullurl,
      image: p.thumbnail?.source ?? null,
      file: p.pageimage ?? null,
      coords: (() => {
        const c = p.coordinates?.find((x) => x.primary) ?? p.coordinates?.[0];
        return c ? [+c.lon.toFixed(4), +c.lat.toFixed(4)] : null;
      })(),
    };
  }
}

// Items whose own article has no free lead photo borrow one from a related article (photoWiki).
for (const b of items.filter((x) => x.photoWiki && media[x.id])) {
  const res = await api("en.wikipedia.org", { action: "query", titles: b.photoWiki, prop: "pageimages", piprop: "thumbnail|name", pithumbsize: "800", redirects: "1" });
  const p = res.query.pages[0];
  if (p?.pageimage) Object.assign(media[b.id], { image: p.thumbnail?.source ?? null, file: p.pageimage });
}

// Commons credit + licence for each photo
const files = [...new Set(Object.values(media).map((m) => m.file).filter(Boolean))];
const credit = {};
for (let i = 0; i < files.length; i += 40) {
  const res = await api("commons.wikimedia.org", {
    action: "query",
    titles: files.slice(i, i + 40).map((f) => `File:${f}`).join("|"),
    prop: "imageinfo",
    iiprop: "extmetadata|url",
    iiextmetadatafilter: "Artist|LicenseShortName|UsageTerms",
  });
  const norm = new Map((res.query.normalized ?? []).map((n) => [n.to, n.from]));
  for (const p of res.query.pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    const name = (norm.get(p.title) ?? p.title).replace(/^File:/, "");
    const md = info.extmetadata ?? {};
    credit[name] = {
      page: info.descriptionurl,
      artist: strip(md.Artist?.value).slice(0, 80) || "Unknown",
      license: strip(md.LicenseShortName?.value) || strip(md.UsageTerms?.value) || "See file page",
    };
  }
}
for (const m of Object.values(media)) {
  const c = m.file ? credit[m.file] ?? credit[m.file.replace(/_/g, " ")] : null;
  m.credit = c ?? null;
  // Images without a known free licence on Commons (e.g. local fair-use files) are not shown.
  if (!c) m.image = null;
  delete m.file;
}

// ---------- 2. Countries ----------
const mledoze = JSON.parse(fs.readFileSync(path.join(ROOT, "data-raw/world/mledoze-countries.json"), "utf8"));
const byIso2 = new Map(mledoze.map((c) => [c.cca2.toLowerCase(), c]));
const places = JSON.parse(fs.readFileSync(path.join(ROOT, "data-raw/world/ne_10m_populated_places_simple.geojson"), "utf8")).features.map((f) => f.properties);
const extra = {};
for (const c of world.countries) {
  const m = byIso2.get(c.id) ?? (c.iso2 ? byIso2.get(c.iso2.toLowerCase()) : undefined);
  const cities = places
    .filter((p) => p.iso_a2 && c.iso2 && p.iso_a2 === c.iso2 && !c.capitals.includes(p.name))
    .sort((a, b) => b.pop_max - a.pop_max)
    .slice(0, 3)
    .map((p) => p.name);
  extra[c.id] = {
    languages: m ? Object.values(m.languages ?? {}) : [],
    currencies: m ? Object.entries(m.currencies ?? {}).map(([code, v]) => ({ code, name: v.name, symbol: v.symbol ?? "" })) : [],
    latlng: m?.latlng ?? null,
    cities,
  };
}

fs.writeFileSync(path.join(GEN, "media.json"), JSON.stringify(media, null, 1));
fs.writeFileSync(path.join(GEN, "countries-extra.json"), JSON.stringify(extra));
const noImg = Object.entries(media).filter(([, m]) => !m.image).map(([k]) => k);
const noCoords = explorer.landmarks.filter((l) => !media[l.id]?.coords).map((l) => l.id);
console.log(`media: ${Object.keys(media).length}/${items.length} items, ${items.length - noImg.length} with photos`);
console.log("no photo:", noImg.join(", ") || "none");
console.log("landmarks without coordinates:", noCoords.join(", ") || "none");
console.log(`countries: ${Object.keys(extra).length}, with currency: ${Object.values(extra).filter((e) => e.currencies.length).length}`);
