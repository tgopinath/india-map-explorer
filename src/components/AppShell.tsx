"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Award, BookOpen, Compass, Globe2, Flame, Home, LayoutGrid, Map as MapIcon, MoreHorizontal, Puzzle, Trophy, Users, Volume2, VolumeX, X } from "lucide-react";
import { actions, BADGES, onBadgeEarned, useProgress } from "@/lib/progress";
import { startSync } from "@/lib/sync";
import { celebrate } from "@/lib/celebrate";
import { announceTap, hasTamilVoice, speak, stopSpeaking } from "@/lib/speech";
import { Mascot } from "./Mascot";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore India", short: "Explore", icon: Compass },
  { href: "/world", label: "World Map", short: "World", icon: Globe2 },
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

// ---------- Android app mode (Material Design 3, from the shared Kolam M3 kit in public/m3) ----------
// Only inside the Android app (or ?app=android): an M3 top app bar and navigation bar replace the web header,
// sidebar and bottom bar (hidden with CSS, see globals.css). In a browser nothing changes.
type M3 = {
  enabled: boolean;
  setTitle(t: string): void;
  setBack(v: boolean | string | null): void;
  setActive(id: string | null): void;
  setActions(a: { id?: string; icon?: string; text?: string; lang?: string; label: string; onClick: () => void }[]): void;
};
type KolamM3Api = { isAndroid: boolean; init(o: Record<string, unknown>): M3 };
const M3_DESTS = [
  { id: "home", label: "Home", icon: "home", href: "/" },
  { id: "explore", label: "Explore", icon: "explore", href: "/explore" },
  { id: "districts", label: "Districts", icon: "map", href: "/districts" },
  { id: "puzzle", label: "Puzzle", icon: "extension", href: "/puzzle" },
  { id: "quiz", label: "Quiz", icon: "emoji_events", href: "/quiz" },
];
const m3Title = (path: string) =>
  path === "/" ? "Map Explorer" : [...NAV, ...EXTRA].find((n) => n.href === path)?.label ?? null;
const m3Parent = (path: string) => "/" + (path.split("/")[1] ?? "");

// ---------- iOS app mode (Apple HIG, from the shared Kolam iOS kit in public/ios) ----------
// Only inside the iOS app (MapExplorer-iOS shell) or with ?app=ios: an iOS navigation bar (large titles on the
// tabs, back + centred title deeper in) and a Liquid Glass tab bar replace the web header, sidebar and bottom bar.
// If both kits detect, iOS wins and the M3 kit is not started. In a browser nothing changes.
type IOSAction = { id?: string; icon?: string; text?: string; label: string; onClick: () => void };
type KolamIOSApi = {
  isIOS: boolean;
  init(o: Record<string, unknown>): KolamIOSApi | null;
  navBar: { set(cfg: { title: string; large?: boolean; back?: { label: string; onClick: () => void } | null; actions?: IOSAction[]; keepTitle?: boolean }): void };
  tabBar: { select(id: string | null): void };
  enhance(el?: Element | null): void;
};
const svg = (inner: string) => `<svg class="ios-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
const IOS_ICON = {
  explore: svg('<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  puzzle: svg('<path d="M10 4.5a2 2 0 1 1 4 0V6h4v4h-1.5a2 2 0 1 0 0 4H18v4.5h-4.5V17a2 2 0 1 0-4 0v1.5H5.5V14H7a2 2 0 1 0 0-4H5.5V6H10z"/>'),
  quiz: svg('<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20h7M10 17h4v3h-4z"/>'),
  speakerOff: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m15.5 9.5 5 5M20.5 9.5l-5 5"/>'),
  grid: svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>'),
};
const IOS_TABS = [
  { id: "home", label: "Home", icon: "house", href: "/" },
  { id: "explore", label: "Explore", icon: IOS_ICON.explore, href: "/explore" },
  { id: "districts", label: "Districts", icon: "map", href: "/districts" },
  { id: "puzzle", label: "Puzzle", icon: IOS_ICON.puzzle, href: "/puzzle" },
  { id: "quiz", label: "Quiz", icon: IOS_ICON.quiz, href: "/quiz" },
];

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

  // Read out whatever is tapped, for children who can't read yet.
  useEffect(() => {
    const onTap = (e: MouseEvent) => announceTap(e.target);
    document.addEventListener("click", onTap, true);
    return () => document.removeEventListener("click", onTap, true);
  }, []);

  useEffect(
    () =>
      onBadgeEarned((ids) => {
        setToast(ids);
        celebrate("big");
        window.setTimeout(() => setToast(null), 4500);
      }),
    [],
  );

  // Android app: M3 bars from the kit. Back closes the More sheet, then goes back a screen, then home, then leaves.
  const router = useRouter();
  const m3 = useRef<M3 | null>(null);
  const stack = useRef<string[]>([]);
  const nav = useRef({ path, more, router });
  useEffect(() => {
    nav.current = { path, more, router };
  });
  const ios = useRef<KolamIOSApi | null>(null);
  const iosActions = useRef<IOSAction[]>([]);
  // Deeper screens have a centred title, so the voice switch moves into More there (HIG: keep bar buttons few).
  const iosBarActions = (root: boolean) => (root ? iosActions.current : iosActions.current.filter((a) => a.id !== "iosLang"));
  const iosNav = useRef<{ title: string; large: boolean; back: { label: string; onClick: () => void } | null } | null>(null);
  useEffect(() => {
    const I = (window as unknown as { KolamIOS?: KolamIOSApi }).KolamIOS;
    if (!I?.isIOS) return;
    document.documentElement.classList.remove("k-android", "k-app");
    ios.current = I.init({
      appName: "Map Explorer",
      uaTokens: ["MapExplorer-iOS"],
      tint: { light: "#2F5FD0", dark: "#2F5FD0" },
      tabs: IOS_TABS,
      currentTab: "home",
      content: "main",
      // Tabs move with the Next router (no full page load).
      onTabSelect: (id: string) => {
        const t = IOS_TABS.find((d) => d.id === id);
        if (t) nav.current.router.push(t.href);
        return false;
      },
    });
  }, []);
  useEffect(() => {
    const K = (window as unknown as { KolamM3?: KolamM3Api }).KolamM3;
    if (!K?.isAndroid || ios.current) return;
    m3.current = K.init({
      primary: "#356ae6",
      title: "Map Explorer",
      destinations: M3_DESTS,
      icons: ["volume_up", "volume_off", "apps", "arrow_back"],
      isRoot: () => M3_DESTS.some((d) => d.href === nav.current.path),
      onBack: () => {
        const { path: here, more: open, router: r } = nav.current;
        if (open) { setMore(false); return true; }
        const root = M3_DESTS.some((d) => d.href === here);
        if (!root) {
          if (stack.current.length > 1) window.history.back();
          else r.push(m3Parent(here) === here ? "/" : m3Parent(here));
          return true;
        }
        if (here !== "/") { r.push("/"); return true; }
        return false; // on Home: the kit leaves the app
      },
    });
  }, []);
  // Per screen: title, active destination and the back arrow (after the kit's own route handling).
  useEffect(() => {
    const st = stack.current;
    if (st[st.length - 2] === path) st.pop(); else if (st[st.length - 1] !== path) st.push(path);
    const io = ios.current;
    if (io) {
      const dest = IOS_TABS.find((d) => isActive(path, d.href) && (d.href !== "/" || path === "/"));
      const root = IOS_TABS.some((d) => d.href === path);
      io.tabBar.select(dest?.id ?? null);
      const t = window.setTimeout(() => {
        const heading = document.querySelector("main h1")?.textContent?.trim();
        const title = m3Title(path) ?? heading ?? "Map Explorer";
        const parent = m3Parent(path) === path ? "/" : m3Parent(path);
        const backLabel = parent === "/" ? "Home" : [...NAV, ...EXTRA].find((n) => n.href === parent)?.label ?? "Back";
        iosNav.current = {
          title: root && path !== "/" ? (IOS_TABS.find((d) => d.href === path)?.label ?? title) : title,
          large: root,
          back: root ? null : { label: backLabel.split(" ").pop() ?? "Back", onClick: () => (st.length > 1 ? window.history.back() : nav.current.router.push(parent)) },
        };
        io.navBar.set({ ...iosNav.current, actions: iosBarActions(root), keepTitle: true });
        io.enhance(document.querySelector("main"));
      }, 250);
      return () => window.clearTimeout(t);
    }
    const c = m3.current;
    if (!c?.enabled) return;
    const dest = M3_DESTS.find((d) => isActive(path, d.href) && (d.href !== "/" || path === "/"));
    const root = M3_DESTS.some((d) => d.href === path);
    const t = window.setTimeout(() => {
      c.setActive(dest?.id ?? null);
      c.setBack(!root);
      c.setTitle(m3Title(path) ?? document.querySelector("main h1")?.textContent?.trim() ?? "Map Explorer");
    }, 250);
    return () => window.clearTimeout(t);
  }, [path]);
  // iOS: the same three actions in the navigation bar (read aloud, voice language, More).
  useEffect(() => {
    const io = ios.current;
    if (!io) return;
    iosActions.current = [
      { id: "iosRead", icon: p.readAloud ? "speaker.wave.2" : IOS_ICON.speakerOff, label: p.readAloud ? "Read aloud is on" : "Read aloud is off",
        onClick: () => { if (p.readAloud) stopSpeaking(); else speak("Okay! I will read things out loud for you.", { force: true }); actions.toggleReadAloud(); } },
      { id: "iosLang", text: p.voiceLang === "ta" ? "த" : "EN", label: p.voiceLang === "ta" ? "Voice: Tamil. Switch to English" : "Voice: English. Switch to Tamil",
        onClick: () => {
          const next = p.voiceLang === "ta" ? "en" : "ta";
          actions.setVoiceLang(next);
          if (next === "en") speak("Okay! I will speak in English.", { force: true });
          else if (hasTamilVoice()) speak("வணக்கம்! இனி பெயர்களைத் தமிழில் சொல்கிறேன்.", { force: true, lang: "ta" });
          else speak("This device has no Tamil voice, so I will keep speaking English.", { force: true });
        } },
      { id: "iosMore", icon: IOS_ICON.grid, label: "More", onClick: () => setMore(true) },
    ];
    // Refresh the bar's buttons in place (the per-screen effect sets title and back).
    if (iosNav.current) io.navBar.set({ ...iosNav.current, actions: iosBarActions(iosNav.current.large), keepTitle: true });
  }, [p.readAloud, p.voiceLang]);
  useEffect(() => {
    m3.current?.setActions([
      { id: "m3Read", icon: p.readAloud ? "volume_up" : "volume_off", label: p.readAloud ? "Read aloud is on" : "Read aloud is off",
        onClick: () => { if (p.readAloud) stopSpeaking(); else speak("Okay! I will read things out loud for you.", { force: true }); actions.toggleReadAloud(); } },
      { id: "m3Lang", text: p.voiceLang === "ta" ? "த" : "EN", lang: p.voiceLang, label: p.voiceLang === "ta" ? "Voice: Tamil. Switch to English" : "Voice: English. Switch to Tamil",
        onClick: () => {
          const next = p.voiceLang === "ta" ? "en" : "ta";
          actions.setVoiceLang(next);
          if (next === "en") speak("Okay! I will speak in English.", { force: true });
          else if (hasTamilVoice()) speak("வணக்கம்! இனி பெயர்களைத் தமிழில் சொல்கிறேன்.", { force: true, lang: "ta" });
          else speak("This device has no Tamil voice, so I will keep speaking English.", { force: true });
        } },
      { id: "m3More", icon: "apps", label: "More", onClick: () => setMore(true) },
    ]);
  }, [p.readAloud, p.voiceLang]);

  // Close the mobile sheet on navigation.
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setMore(false);
  }

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="m3-web sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-1 border-r border-line bg-white px-4 py-5 lg:flex">
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
        <header className="m3-web sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-2 backdrop-blur lg:hidden">
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

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8 xl:px-20">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="m3-web fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Main">
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
        <div className="m3-sheet fixed inset-0 z-50 bg-ink/30 lg:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-x-0 bottom-0 animate-pop rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold">More</h2>
              <button type="button" aria-label="Close" onClick={() => setMore(false)} className="grid size-10 place-items-center rounded-full bg-bg">
                <X className="size-5" />
              </button>
            </div>
            <div className="ios-only mb-3 grid grid-cols-2 gap-3">
              <ReadToggle on={p.readAloud} />
              <VoiceLangToggle lang={p.voiceLang} />
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
