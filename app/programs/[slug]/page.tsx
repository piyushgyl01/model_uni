import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogRepository } from "../../../content/catalog";
import ProgramPage from "../../program-page";

interface ProgramRouteProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProgramRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = catalogRepository.loadBySlug(slug);
  if (!bundle) return { title: "Program not published — Course Atlas" };

  return {
    title: `${bundle.programVersion.title} — Course Atlas`,
    description: bundle.programVersion.summary,
  };
}

export default async function ProgramRoute({ params }: ProgramRouteProps) {
  const { slug } = await params;
  const bundle = catalogRepository.loadBySlug(slug);
  if (!bundle) notFound();
  return <ProgramPage bundle={bundle} />;
}
