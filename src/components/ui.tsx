"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, BadgeCheck, Info, Star } from "lucide-react";
import type { DataStatus } from "@/lib/content";

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

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-base text-ink-soft sm:text-lg">{subtitle}</p>}
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
