import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href = "/games", label = "All games" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="mb-3 inline-flex items-center gap-1 font-display font-bold text-primary">
      <ArrowLeft className="size-5" /> {label}
    </Link>
  );
}
