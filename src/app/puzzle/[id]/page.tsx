import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PuzzleGame from "@/components/PuzzleGame";
import { Loading, PageHeader } from "@/components/ui";
import { getState, STATES } from "@/lib/content";
import { continentBySlug, CONTINENT_BOX, CONTINENTS, countriesIn } from "@/lib/world";

const WORLD_PUZZLES = CONTINENTS.filter((c) => CONTINENT_BOX[c.id]);

export function generateStaticParams() {
  return [{ id: "india" }, ...WORLD_PUZZLES.map((c) => ({ id: `world-${c.slug}` })), ...STATES.map((s) => ({ id: s.id }))];
}

export default function Page({ params }: PageProps<"/puzzle/[id]">) {
  return <Suspense fallback={<Loading />}>{params.then(({ id }) => <Content id={id} />)}</Suspense>;
}

function heading(id: string) {
  if (id === "india") return { title: "Arrange the States", subtitle: "Put India's 28 states and 8 Union Territories in the right place." };
  const cont = id.startsWith("world-") ? continentBySlug(id.slice(6)) : undefined;
  if (cont && CONTINENT_BOX[cont.id])
    return { title: `${cont.id} Puzzle`, subtitle: `Put the ${countriesIn(cont.id).length} countries and territories of ${cont.id} in the right place.` };
  const s = getState(id);
  if (s) return { title: `${s.name} District Challenge`, subtitle: `Put all ${s.districtCount} districts in the right place.` };
  return null;
}

function Content({ id }: { id: string }) {
  const h = heading(id);
  if (!h) notFound();
  return (
    <div>
      <Link href="/puzzle" className="mb-3 inline-flex items-center gap-1 font-display font-bold text-primary">
        <ArrowLeft className="size-5" /> All puzzles
      </Link>
      <PageHeader title={h.title} subtitle={h.subtitle} />
      <PuzzleGame key={id} mapKey={id} />
    </div>
  );
}
