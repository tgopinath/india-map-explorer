// Question generators for quizzes and mini games. Every answer is derived from the
// content layer (curated capitals) or the boundary data (neighbours, districts).

import { getDistricts, getState, sample, shortCapital, shuffle, STATES, type StateInfo } from "./content";

export type Question =
  | { kind: "mcq"; id: string; prompt: string; map: "india" | "district"; highlight: string | null; options: string[]; answer: string; key: string; explain: string }
  | { kind: "tap"; id: string; prompt: string; map: "india" | "district"; answer: string; key: string; explain: string };

/** Pick distractors close to the answer first (neighbours, same region) so questions make kids think. */
function nearFirst<T>(pool: T[], near: T[], n: number) {
  const a = shuffle([...new Set(near)].filter((x) => pool.includes(x))).slice(0, Math.ceil(n / 2));
  const rest = shuffle(pool.filter((x) => !a.includes(x)));
  return [...a, ...rest].slice(0, n);
}

const sameRegion = (s: StateInfo) => STATES.filter((x) => x.region === s.region && x.id !== s.id).map((x) => x.id);

export function identifyStateQs(n = 10): Question[] {
  return sample(STATES, n).map((s) => {
    const others = nearFirst(STATES.map((x) => x.id).filter((id) => id !== s.id), [...s.neighbours, ...sameRegion(s)], 3);
    return {
      kind: "mcq",
      id: `id-${s.id}`,
      prompt: "Which state or Union Territory is glowing?",
      map: "india",
      highlight: s.id,
      options: shuffle([s.id, ...others]).map((id) => getState(id)!.name),
      answer: s.name,
      key: `state:${s.id}`,
      explain: `That's ${s.name}, in ${s.region === "Islands" ? "the islands" : `${s.region} India`}.`,
    };
  });
}

// States that share a capital city are skipped so every answer is unique.
const uniqueCapital = () => {
  const counts = new Map<string, number>();
  STATES.forEach((s) => counts.set(shortCapital(s), (counts.get(shortCapital(s)) ?? 0) + 1));
  return STATES.filter((s) => counts.get(shortCapital(s)) === 1);
};

export function capitalMcqQs(n = 5): Question[] {
  const pool = uniqueCapital();
  return sample(pool, n).map((s) => {
    const others = nearFirst(pool.filter((x) => x.id !== s.id), pool.filter((x) => x.region === s.region), 3);
    return {
      kind: "mcq",
      id: `cap-${s.id}`,
      prompt: `What is the capital of ${s.name}?`,
      map: "india",
      highlight: s.id,
      options: shuffle([s, ...others]).map(shortCapital),
      answer: shortCapital(s),
      key: `capital:${s.id}`,
      explain: `${s.name}'s capital is ${s.capital}.`,
    };
  });
}

export function findCapitalQs(n = 10): Question[] {
  return sample(uniqueCapital(), n).map((s) => ({
    kind: "tap",
    id: `fc-${s.id}`,
    prompt: `${shortCapital(s)} is a capital city. Tap its ${s.type === "ut" ? "Union Territory" : "state"}!`,
    map: "india",
    answer: s.id,
    key: `capital:${s.id}`,
    explain: `${shortCapital(s)} is the capital of ${s.name}.`,
  }));
}

export function neighbourMcqQs(n = 5): Question[] {
  const pool = STATES.filter((s) => s.neighbours.length > 0 && STATES.length - s.neighbours.length > 4);
  return sample(pool, n).map((s) => {
    const right = sample(s.neighbours, 1)[0];
    const wrong = nearFirst(
      STATES.map((x) => x.id).filter((id) => id !== s.id && !s.neighbours.includes(id)),
      sameRegion(s),
      3,
    );
    return {
      kind: "mcq",
      id: `nb-${s.id}`,
      prompt: `Which of these is a neighbour of ${s.name}?`,
      map: "india",
      highlight: s.id,
      options: shuffle([right, ...wrong]).map((id) => getState(id)!.name),
      answer: getState(right)!.name,
      key: `neighbour:${s.id}`,
      explain: `${s.name} touches ${s.neighbours.map((x) => getState(x)!.name).join(", ")}.`,
    };
  });
}

export function districtMcqQs(stateId: string, n = 10): Question[] {
  const ds = getDistricts(stateId);
  return sample(ds, Math.min(n, ds.length)).map((d) => {
    const others = nearFirst(ds.filter((x) => x.id !== d.id).map((x) => x.id), d.neighbours, 3);
    const nameOf = (id: string) => ds.find((x) => x.id === id)!.name;
    return {
      kind: "mcq",
      id: `dm-${d.id}`,
      prompt: "Which district is glowing?",
      map: "district",
      highlight: d.id,
      options: shuffle([d.id, ...others]).map(nameOf),
      answer: d.name,
      key: `district:${stateId}:${d.id}`,
      explain: d.headquarters ? `That's ${d.name}. Its headquarters is ${d.headquarters}.` : `That's ${d.name}.`,
    };
  });
}

export function districtTapQs(stateId: string, n = 10): Question[] {
  return sample(getDistricts(stateId), n).map((d) => ({
    kind: "tap",
    id: `dt-${d.id}`,
    prompt: `Where is ${d.name}? Tap it on the map!`,
    map: "district",
    answer: d.id,
    key: `district:${stateId}:${d.id}`,
    explain: d.fact ?? `${d.name} is a district of ${getState(stateId)!.name}.`,
  }));
}
