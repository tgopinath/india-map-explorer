import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loading } from "@/components/ui";
import { getState, STATES } from "@/lib/content";
import DistrictExplorer from "./DistrictExplorer";

export function generateStaticParams() {
  return STATES.map((s) => ({ id: s.id }));
}

export default function Page({ params }: PageProps<"/districts/[id]">) {
  return <Suspense fallback={<Loading />}>{params.then(({ id }) => <Content id={id} />)}</Suspense>;
}

function Content({ id }: { id: string }) {
  if (!getState(id)) notFound();
  return <DistrictExplorer id={id} />;
}
