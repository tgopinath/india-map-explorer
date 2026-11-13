import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PuzzleGame from "@/components/PuzzleGame";
import { Loading, PageHeader } from "@/components/ui";
import { getState, STATES } from "@/lib/content";

export function generateStaticParams() {
  return [{ id: "india" }, ...STATES.map((s) => ({ id: s.id }))];
}

export default function Page({ params }: PageProps<"/puzzle/[id]">) {
  return <Suspense fallback={<Loading />}>{params.then(({ id }) => <Content id={id} />)}</Suspense>;
}

function Content({ id }: { id: string }) {
  const s = id === "india" ? null : getState(id);
  if (id !== "india" && !s) notFound();
  return (
    <div>
      <Link href="/puzzle" className="mb-3 inline-flex items-center gap-1 font-display font-bold text-primary">
        <ArrowLeft className="size-5" /> All puzzles
      </Link>
      <PageHeader
        title={s ? `${s.name} District Challenge` : "Arrange the States"}
        subtitle={s ? `Put all ${s.districtCount} districts in the right place.` : "Put India's 28 states and 8 Union Territories in the right place."}
      />
      <PuzzleGame key={id} mapKey={id} />
    </div>
  );
}
