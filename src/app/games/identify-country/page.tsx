"use client";

import QuizRunner from "@/components/QuizRunner";
import { BackLink } from "@/components/games/BackLink";
import { PageHeader } from "@/components/ui";
import { shuffle } from "@/lib/content";
import { continentQs, identifyCountryQs } from "@/lib/questions";
import { actions } from "@/lib/progress";

export default function IdentifyCountry() {
  return (
    <div>
      <BackLink />
      <PageHeader title="Identify the Country" subtitle="A country is glowing orange on the world map. Which one is it — and which continent?" />
      <QuizRunner
        make={() => shuffle([...identifyCountryQs(7), ...continentQs(3)])}
        onFinish={(r) => actions.finishGame("identify-country", r.score)}
        backHref="/games"
        backLabel="More games"
      />
    </div>
  );
}
