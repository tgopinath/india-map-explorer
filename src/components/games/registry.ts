import { Crosshair, Landmark, Puzzle, ScanSearch, Users } from "lucide-react";

export const GAMES = [
  { id: "identify-state", href: "/games/identify-state", title: "Identify the State", blurb: "Which state is glowing?", icon: ScanSearch, bg: "#e3ebfd", fg: "#356ae6" },
  { id: "find-capital", href: "/games/find-capital", title: "Find the Capital", blurb: "Tap the state that owns the capital", icon: Landmark, bg: "#fff4d6", fg: "#c58a00" },
  { id: "district-explorer", href: "/games/district-explorer", title: "District Explorer", blurb: "Find districts on the map", icon: Crosshair, bg: "#dcf5ea", fg: "#1d7a52" },
  { id: "arrange-states", href: "/puzzle/india", title: "Arrange the States", blurb: "Put every state in its place", icon: Puzzle, bg: "#ffe8de", fg: "#d9592a" },
  { id: "neighbours", href: "/games/neighbours", title: "Neighbour Challenge", blurb: "Find all the neighbours", icon: Users, bg: "#efe8fd", fg: "#7b55e0" },
] as const;
