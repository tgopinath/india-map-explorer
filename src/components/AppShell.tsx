"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Award, BookOpen, Compass, Flame, Home, LayoutGrid, Map as MapIcon, MoreHorizontal, Puzzle, Trophy, Users, Volume2, VolumeX, X } from "lucide-react";
import { actions, BADGES, onBadgeEarned, useProgress } from "@/lib/progress";
import { startSync } from "@/lib/sync";
import { celebrate } from "@/lib/celebrate";
import { hasTamilVoice, speak, stopSpeaking } from "@/lib/speech";
import { Mascot } from "./Mascot";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore India", short: "Explore", icon: Compass },
  { href: "/states", label: "Learn States", short: "States", icon: BookOpen },
  { href: "/districts", label: "Learn Districts", short: "Districts", icon: MapIcon },
  { href: "/puzzle", label: "Map Puzzle", short: "Puzzle", icon: Puzzle },
  { href: "/quiz", label: "Quiz Challenge", short: "Quiz", icon: Trophy },
  { href: "/progress", label: "My Progress", short: "Progress", icon: Award },
];
const EXTRA = [
  { href: "/games", label: "Mini Games", icon: LayoutGrid },
  { href: "/parent", label: "Parent Corner", icon: Users },
];
const MOBILE_MAIN = ["/", "/explore", "/districts", "/puzzle", "/quiz"];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

export default function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const p = useProgress();
  const [more, setMore] = useState(false);
  const [toast, setToast] = useState<string[] | null>(null);

  // Count learning time while the app is visible.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") actions.addTime(30);
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => startSync(), []);

  useEffect(
    () =>
      onBadgeEarned((ids) => {
        setToast(ids);
        celebrate("big");
        window.setTimeout(() => setToast(null), 4500);
      }),
    [],
  );

  // Close the mobile sheet on navigation.
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setMore(false);
  }

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-1 border-r border-line bg-white px-4 py-5 lg:flex">
        <Link href="/" className="mb-4 flex items-center gap-2 px-2">
          <Mascot size={48} />
          <span className="font-display text-xl font-extrabold leading-tight text-primary">
            India Map
            <br />
            Explorer
          </span>
        </Link>
        {[...NAV, ...EXTRA].map(({ href, label, icon: Icon }) => {
          const on = isActive(path, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 font-display text-[17px] font-semibold transition ${
                on ? "bg-primary text-white shadow-[0_3px_0_#2450bd]" : "text-ink-soft hover:bg-primary-soft hover:text-primary"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
        <div className="mt-auto space-y-2">
        <ReadToggle on={p.readAloud} />
        <VoiceLangToggle lang={p.voiceLang} />
        <div className="rounded-2xl bg-secondary-soft p-3 text-sm">
          <div className="flex items-center gap-2 font-display text-base font-bold text-[#8a5b00]">
            <Flame className="size-5 text-accent" /> {p.streak.current || 0}-day streak
          </div>
          <p className="mt-1 text-ink-soft">{p.points.toLocaleString()} points</p>
        </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-2 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Mascot size={36} />
            <span className="font-display text-lg font-extrabold text-primary">India Map Explorer</span>
          </Link>
          <div className="flex items-center gap-2">
          <ReadToggle on={p.readAloud} compact />
          <VoiceLangToggle lang={p.voiceLang} compact />
          <span className="flex items-center gap-1 rounded-full bg-secondary-soft px-3 py-1 font-display text-sm font-bold text-[#8a5b00]">
            <Flame className="size-4 text-accent" /> {p.streak.current || 0}
          </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Main">
        <div className="grid grid-cols-6">
          {NAV.filter((n) => MOBILE_MAIN.includes(n.href)).map(({ href, label, short, icon: Icon }) => {
            const on = isActive(path, href);
            return (
              <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${on ? "text-primary" : "text-ink-soft"}`}>
                <span className={`grid h-8 w-12 place-items-center rounded-full ${on ? "bg-primary-soft" : ""}`}>
                  <Icon className="size-5" />
                </span>
                {short ?? label}
              </Link>
            );
          })}
          <button type="button" onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold text-ink-soft">
            <span className="grid h-8 w-12 place-items-center rounded-full">
              <MoreHorizontal className="size-5" />
            </span>
            More
          </button>
        </div>
      </nav>

      {more && (
        <div className="fixed inset-0 z-50 bg-ink/30 lg:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-x-0 bottom-0 animate-pop rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold">More</h2>
              <button type="button" aria-label="Close" onClick={() => setMore(false)} className="grid size-10 place-items-center rounded-full bg-bg">
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[...NAV.filter((n) => !MOBILE_MAIN.includes(n.href)), ...EXTRA].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl bg-bg px-4 py-4 font-display text-lg font-semibold">
                  <Icon className="size-6 text-primary" /> {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-4 top-4 z-[60] mx-auto max-w-md animate-pop rounded-3xl bg-white p-4 shadow-[0_20px_50px_-12px_rgba(31,42,68,0.35)]" role="status">
          <div className="flex items-center gap-3">
            <Mascot mood="cheer" size={64} />
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide text-accent">New badge!</p>
              {toast.map((id) => {
                const b = BADGES.find((x) => x.id === id)!;
                return (
                  <p key={id} className="font-display text-xl font-extrabold">
                    {b.name}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadToggle({ on, compact = false }: { on: boolean; compact?: boolean }) {
  const toggle = () => {
    if (on) stopSpeaking();
    else speak("Okay! I will read things out loud for you.", { force: true });
    actions.toggleReadAloud();
  };
  const label = on ? "Read aloud is on" : "Read aloud is off";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`flex items-center gap-2 rounded-full font-display font-bold transition ${compact ? "size-10 justify-center" : "w-full px-3 py-2.5 text-[17px]"} ${
        on ? "bg-success-soft text-[#1d7a52]" : "bg-bg text-ink-soft"
      }`}
    >
      {on ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
      {!compact && (on ? "Read aloud: on" : "Read aloud: off")}
    </button>
  );
}

/** Switch the read-aloud voice between English and Tamil (names and facts). */
function VoiceLangToggle({ lang, compact = false }: { lang: "en" | "ta"; compact?: boolean }) {
  const choose = (next: "en" | "ta") => {
    actions.setVoiceLang(next);
    if (next === "ta") {
      if (hasTamilVoice()) speak("வணக்கம்! இனி பெயர்களைத் தமிழில் சொல்கிறேன்.", { force: true, lang: "ta" });
      else speak("This device has no Tamil voice, so I will keep speaking English.", { force: true });
    } else speak("Okay! I will speak in English.", { force: true });
  };
  return (
    <div role="group" aria-label="Voice language" className={`flex rounded-full bg-bg p-1 ${compact ? "" : "w-full"}`}>
      {(["en", "ta"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => choose(l)}
          className={`rounded-full font-display font-bold transition ${compact ? "h-8 min-w-8 px-2 text-sm" : "flex-1 px-3 py-1.5"} ${
            lang === l ? "bg-primary text-white" : "text-ink-soft"
          }`}
        >
          {l === "en" ? (compact ? "EN" : "English") : compact ? "த" : "தமிழ்"}
        </button>
      ))}
    </div>
  );
}
