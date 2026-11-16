"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Flame, Globe2, Map as MapIcon, Puzzle, Star, Trophy } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { Card, LinkButton, ProgressBar } from "@/components/ui";
import { GameCards } from "@/components/games/GameCards";
import { getDistricts, PILOT_STATE, STATE_COUNT, UT_COUNT } from "@/lib/content";
import { levelFor, useProgress } from "@/lib/progress";

const SECTIONS = [
  { href: "/explore", title: "Explore India", text: "Tap any state on the big map", icon: Compass, bg: "bg-primary-soft", fg: "text-primary" },
  { href: "/states", title: "Learn States", text: "Capitals, languages & fun facts", icon: BookOpen, bg: "bg-success-soft", fg: "text-success" },
  { href: "/districts/tamil-nadu", title: "Learn Districts", text: "Discover all 38 districts of Tamil Nadu", icon: MapIcon, bg: "bg-secondary-soft", fg: "text-[#c58a00]" },
  { href: "/puzzle", title: "Map Puzzle", text: "Drag names to the right place", icon: Puzzle, bg: "bg-accent-soft", fg: "text-accent" },
  { href: "/world", title: "World Map", text: "Visit countries on every continent", icon: Globe2, bg: "bg-[#e0f4f1]", fg: "text-[#1f8a7a]" },
  { href: "/quiz", title: "Quiz Challenge", text: "Beginner to Advanced", icon: Trophy, bg: "bg-[#efe8fd]", fg: "text-[#7b55e0]" },
];

export default function Home() {
  const p = useProgress();
  const lvl = levelFor(p.points);
  const tnTotal = getDistricts(PILOT_STATE).length;
  const tnLearned = p.districtsLearned[PILOT_STATE]?.length ?? 0;
  const greeting = p.points === 0 ? "Hi! I'm Gaju. Let's explore India together!" : `Welcome back, ${lvl.name}! Ready for today's adventure?`;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-white sm:px-10 sm:py-10">
        <svg className="absolute -right-10 -top-10 h-64 w-64 opacity-15" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 6" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="2" />
        </svg>
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Mascot mood="cheer" size={140} className="animate-float" />
          <div className="flex-1">
            <p className="font-display text-lg font-semibold text-secondary">{greeting}</p>
            <h1 className="mt-1 text-4xl font-extrabold leading-tight sm:text-5xl">India Map Explorer</h1>
            <p className="mt-2 max-w-xl text-lg text-white/85">
              Discover {STATE_COUNT} states, {UT_COUNT} Union Territories and their districts through maps, puzzles and games.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href="/explore" tone="secondary">
                Start exploring <ArrowRight className="size-5" />
              </LinkButton>
              <LinkButton href={`/puzzle/${PILOT_STATE}`} tone="white">
                Tamil Nadu puzzle
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-secondary-soft">
            <Star className="size-7 fill-secondary text-[#e5a100]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-soft">Level {lvl.index + 1}</p>
            <p className="font-display text-xl font-bold">{lvl.name}</p>
            <ProgressBar value={lvl.pct} tone="bg-secondary" className="mt-2" />
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-accent-soft">
            <Flame className="size-7 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink-soft">Daily streak</p>
            <p className="font-display text-xl font-bold">{p.streak.current || 0} days</p>
            <p className="text-sm text-ink-soft">Best: {p.streak.best} days</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-success-soft">
            <MapIcon className="size-7 text-success" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-soft">Tamil Nadu districts</p>
            <p className="font-display text-xl font-bold">
              {tnLearned} / {tnTotal} learned
            </p>
            <ProgressBar value={tnLearned / tnTotal} tone="bg-success" className="mt-2" />
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Where to next?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ href, title, text, icon: Icon, bg, fg }) => (
            <Link key={href} href={href} className="group rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1">
              <div className={`mb-3 grid size-14 place-items-center rounded-2xl ${bg}`}>
                <Icon className={`size-7 ${fg}`} />
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-ink-soft">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Mini games</h2>
          <Link href="/games" className="font-display font-bold text-primary">
            See all
          </Link>
        </div>
        <GameCards ids={["identify-state", "arrange-states", "identify-country"]} />
      </section>
    </div>
  );
}
