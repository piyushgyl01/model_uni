import { permanentRedirect } from "next/navigation";

interface LegacyDegreeRouteProps {
  readonly params: Promise<{ slug: string }>;
}

export default async function LegacyDegreeRoute({
  params,
}: LegacyDegreeRouteProps) {
  const { slug } = await params;
  permanentRedirect(`/programs/${encodeURIComponent(slug)}`);
}
