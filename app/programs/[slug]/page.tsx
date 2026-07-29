import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRuntimeCatalogRepository } from "../../catalog/cloudflare-catalog";
import ProgramPage from "../../program-page";

export const dynamic = "force-dynamic";

interface ProgramRouteProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProgramRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const catalogRepository = await getRuntimeCatalogRepository();
  const bundle = await catalogRepository.loadBySlug(slug);
  if (!bundle) return { title: "Program not published — Course Atlas" };

  return {
    title: `${bundle.programVersion.title} — Course Atlas`,
    description: bundle.programVersion.summary,
  };
}

export default async function ProgramRoute({ params }: ProgramRouteProps) {
  const { slug } = await params;
  const catalogRepository = await getRuntimeCatalogRepository();
  const bundle = await catalogRepository.loadBySlug(slug);
  if (!bundle) notFound();
  return <ProgramPage bundle={bundle} />;
}
