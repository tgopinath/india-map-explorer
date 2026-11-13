"use client";

// Read-aloud for children who can't read yet, using the browser's built-in voices.
// English uses an Indian English voice; Tamil uses a ta-IN voice when the device has one.

import { getProgress } from "./progress";

export type VoiceLang = "en" | "ta";

const cache: Partial<Record<VoiceLang, SpeechSynthesisVoice | null>> = {};

function pickVoice(lang: VoiceLang) {
  if (cache[lang] !== undefined) return cache[lang]!;
  const all = window.speechSynthesis.getVoices();
  if (!all.length) return null; // voices load async; try again next time
  cache[lang] =
    lang === "ta"
      ? all.find((v) => v.lang.toLowerCase().startsWith("ta")) ?? null
      : all.find((v) => v.lang === "en-IN") ??
        all.find((v) => v.lang.startsWith("en-") && /india|rishi|veena|heera|ravi/i.test(v.name)) ??
        all.find((v) => v.lang.startsWith("en")) ??
        null;
  return cache[lang]!;
}

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;
export const hasTamilVoice = () => speechSupported() && Boolean(pickVoice("ta"));

/** Speak text now, interrupting anything already being said. */
export function speak(text: string, { force = false, lang = "en" as VoiceLang } = {}) {
  if (!speechSupported() || !text) return;
  if (!force && !getProgress().readAloud) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[★⭐]/g, ""));
  const v = pickVoice(lang);
  if (v) u.voice = v;
  u.lang = v?.lang ?? (lang === "ta" ? "ta-IN" : "en-IN");
  u.rate = lang === "ta" ? 0.85 : 0.88;
  u.pitch = 1.1;
  synth.speak(u);
}

/** Speak a name or fact in the child's chosen voice language, falling back to English. */
export function speakLocal(en: string, ta?: string | null, opts: { force?: boolean } = {}) {
  if (getProgress().voiceLang === "ta" && ta && hasTamilVoice()) speak(ta, { ...opts, lang: "ta" });
  else speak(en, opts);
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}
