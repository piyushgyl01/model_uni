import { notFound, redirect } from "next/navigation";
import { catalogRepository } from "../../../content/catalog";

type DegreeRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function DegreeRoute({ params }: DegreeRouteProps) {
  const { slug } = await params;
  const bundle = catalogRepository.loadBySlug(slug);
  if (!bundle) notFound();
  redirect(`/programs/${bundle.program.canonicalSlug}`);
}
