import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loading } from "@/components/ui";
import { COUNTRIES, getCountry } from "@/lib/world";
import CountryExplorer from "./CountryExplorer";

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ id: c.id }));
}

export default function Page({ params }: PageProps<"/world/[id]">) {
  return <Suspense fallback={<Loading />}>{params.then(({ id }) => <Content id={id} />)}</Suspense>;
}

function Content({ id }: { id: string }) {
  if (!getCountry(id)) notFound();
  return <CountryExplorer id={id} />;
}
