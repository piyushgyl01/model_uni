import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DegreePage from "../../degree-page";
import {
  getDegreeBySlug,
  liveDegrees,
} from "../../program-registry";

type DegreeRouteProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return liveDegrees.map((degree) => ({ slug: degree.slug }));
}

export async function generateMetadata({
  params,
}: DegreeRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const degree = getDegreeBySlug(slug);

  if (!degree || degree.status !== "live") {
    return { title: "Degree not published — Course Atlas" };
  }

  return {
    title: `${degree.name} — Course Atlas`,
    description: `${degree.facts.join(" · ")}. A complete independent-study route with free courses, weekly work, assessments, labs, and portfolio evidence.`,
  };
}

export default async function DegreeRoute({ params }: DegreeRouteProps) {
  const { slug } = await params;
  const degree = getDegreeBySlug(slug);

  if (!degree || degree.status !== "live") {
    notFound();
  }

  if (degree.programId === "ee-beng") {
    return <DegreePage />;
  }

  notFound();
}
