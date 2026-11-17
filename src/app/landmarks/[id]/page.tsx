import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loading } from "@/components/ui";
import { getLandmark, LANDMARKS } from "@/lib/explorer";
import LandmarkDetail from "./LandmarkDetail";

export function generateStaticParams() {
  return LANDMARKS.map((l) => ({ id: l.id }));
}

export default function Page({ params }: PageProps<"/landmarks/[id]">) {
  return <Suspense fallback={<Loading />}>{params.then(({ id }) => <Content id={id} />)}</Suspense>;
}

function Content({ id }: { id: string }) {
  if (!getLandmark(id)) notFound();
  return <LandmarkDetail id={id} />;
}
