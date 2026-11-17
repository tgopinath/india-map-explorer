import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loading } from "@/components/ui";
import { CONTINENTS, continentBySlug } from "@/lib/world";
import ContinentExplorer from "./ContinentExplorer";

export function generateStaticParams() {
  return CONTINENTS.map((c) => ({ slug: c.slug }));
}

export default function Page({ params }: PageProps<"/world/continent/[slug]">) {
  return <Suspense fallback={<Loading />}>{params.then(({ slug }) => <Content slug={slug} />)}</Suspense>;
}

function Content({ slug }: { slug: string }) {
  const c = continentBySlug(slug);
  if (!c) notFound();
  return <ContinentExplorer id={c.id} />;
}
