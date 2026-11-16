"use client";

import Link from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, BadgeCheck, ChevronDown, ChevronUp, Info, Star, Volume2 } from "lucide-react";
import type { DataStatus } from "@/lib/content";
import { speakLines } from "@/lib/speech";

type Tone = "primary" | "secondary" | "success" | "accent" | "ghost" | "white";

const TONES: Record<Tone, string> = {
  primary: "bg-primary text-white shadow-[0_4px_0_#2450bd] hover:bg-[#3d74f0]",
  secondary: "bg-secondary text-ink shadow-[0_4px_0_#d9a43a] hover:bg-[#ffd06e]",
  success: "bg-success text-white shadow-[0_4px_0_#268a5f] hover:bg-[#3dc289]",
  accent: "bg-accent text-white shadow-[0_4px_0_#d96a3e] hover:bg-[#ff9a70]",
  white: "bg-white text-ink shadow-[0_4px_0_#d5dcea] hover:bg-primary-soft",
  ghost: "bg-transparent text-primary hover:bg-primary-soft",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-display text-lg font-bold leading-none transition active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-45";

export function Button({ tone = "primary", className = "", ...rest }: ComponentProps<"button"> & { tone?: Tone }) {
  return <button type="button" className={`${base} ${TONES[tone]} ${className}`} {...rest} />;
}

export function LinkButton({ tone = "primary", className = "", ...rest }: ComponentProps<typeof Link> & { tone?: Tone }) {
  return <Link className={`${base} ${TONES[tone]} ${className}`} {...rest} />;
}

export function Card({ className = "", children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={`rounded-[var(--radius-card)] bg-card p-5 shadow-[var(--shadow-card)] ${className}`} {...rest}>
      {children}
    </div>
  );
}

/** Page title with an optional inline back button (a link, or a callback for in-page steps). */
export function PageHeader({
  title,
  subtitle,
  children,
  back,
  backLabel = "Go back",
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  back?: string | (() => void);
  backLabel?: string;
}) {
  const cls =
    "mt-1 grid size-11 shrink-0 place-items-center rounded-full bg-white text-primary shadow-[0_3px_0_#d5dcea] transition hover:bg-primary-soft active:translate-y-px sm:size-12";
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {back &&
          (typeof back === "string" ? (
            <Link href={back} aria-label={backLabel} title={backLabel} className={cls}>
              <ArrowLeft className="size-6" />
            </Link>
          ) : (
            <button type="button" onClick={back} aria-label={backLabel} title={backLabel} className={cls}>
              <ArrowLeft className="size-6" />
            </button>
          ))}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{title}</h1>
            <button
              type="button"
              onClick={() => speakLines([title, typeof subtitle === "string" ? subtitle : ""], { force: true })}
              aria-label={`Read: ${title}`}
              title="Read this out"
              data-no-announce
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary transition hover:bg-primary hover:text-white active:translate-y-px"
            >
              <Volume2 className="size-5" />
            </button>
          </div>
          {subtitle && <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function Stars({ count, max = 3, size = "size-6" }: { count: number; max?: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`${size} ${i < count ? "fill-secondary text-[#e5a100]" : "fill-line text-line"}`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${className}`}>{children}</span>
  );
}

/** Tells kids and parents how trustworthy a map is. */
export function DataStatusBadge({ status, issues = [] }: { status: DataStatus; issues?: string[] }) {
  if (status === "verified")
    return (
      <Chip className="bg-success-soft text-[#1d7a52]">
        <BadgeCheck className="size-4" /> Verified map
      </Chip>
    );
  if (status === "issues")
    return (
      <Chip className="bg-danger-soft text-[#a8262b]">
        <AlertTriangle className="size-4" /> <span title={issues.join(" ")}>Map data needs update</span>
      </Chip>
    );
  return (
    <Chip className="bg-secondary-soft text-[#8a5b00]">
      <Info className="size-4" /> <span title="Official LGD boundaries, December 2023 snapshot. Not yet reviewed against the latest district list.">LGD 2023 map · review pending</span>
    </Chip>
  );
}

export function ProgressBar({ value, tone = "bg-primary", className = "" }: { value: number; tone?: string; className?: string }) {
  return (
    <div className={`h-3 overflow-hidden rounded-full bg-line ${className}`}>
      <div className={`h-full rounded-full ${tone} transition-[width] duration-500`} style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
    </div>
  );
}

export function Loading({ label = "Unfolding the map…" }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center rounded-[var(--radius-card)] bg-sea text-ink-soft">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
        <p className="font-display text-lg">{label}</p>
      </div>
    </div>
  );
}

/**
 * Shows the first few items with a "More" button for the rest, so pages stay short and calm.
 * `className` styles the wrapper the items sit in (e.g. a grid); `as="ul"` for lists.
 */
export function ShowMore<T>({
  items,
  initial,
  render,
  className = "",
  noun = "more",
  as: Tag = "div",
}: {
  items: T[];
  initial: number;
  render: (item: T, index: number) => ReactNode;
  className?: string;
  noun?: string;
  as?: "div" | "ul";
}) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, initial);
  const hidden = items.length - initial;
  return (
    <>
      <Tag className={className}>{shown.map(render)}</Tag>
      {hidden > 0 && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Show less" : `Show ${hidden} ${noun}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-lg font-bold text-primary shadow-[0_3px_0_#d5dcea] transition hover:bg-primary-soft active:translate-y-px"
          >
            {open ? (
              <>
                Show less <ChevronUp className="size-5" />
              </>
            ) : (
              <>
                More <span className="rounded-full bg-primary-soft px-2 text-sm">+{hidden}</span> <ChevronDown className="size-5" />
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}

/** Round speaker button that reads something aloud; sits on top of a card, not inside its link. */
export function SpeakButton({ label, onSpeak, className = "", tone = "primary" }: { label: string; onSpeak: () => void; className?: string; tone?: "primary" | "white" }) {
  return (
    <button
      type="button"
      onClick={onSpeak}
      aria-label={label}
      title={label}
      data-no-announce
      className={`grid size-12 place-items-center rounded-full transition active:translate-y-px ${
        tone === "white" ? "bg-white text-primary shadow-[0_3px_0_#d5dcea]" : "bg-primary text-white shadow-[0_3px_0_#2450bd]"
      } ${className}`}
    >
      <Volume2 className="size-6" />
    </button>
  );
}
