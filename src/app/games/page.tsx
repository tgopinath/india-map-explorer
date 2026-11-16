"use client";

import { PageHeader } from "@/components/ui";
import { GameCards } from "@/components/games/GameCards";

export default function GamesHub() {
  return (
    <div>
      <PageHeader back="/"  title="Mini Games" subtitle="Quick map games to practise what you've learned." />
      <GameCards />
    </div>
  );
}
