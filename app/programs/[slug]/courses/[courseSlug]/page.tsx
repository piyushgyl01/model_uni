import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRuntimeCatalogRepository } from "../../../../catalog/cloudflare-catalog";
import CoursePage from "../../../../course-page";

export const dynamic = "force-dynamic";

interface CourseRouteProps {
  readonly params: Promise<{ slug: string; courseSlug: string }>;
}

export async function generateMetadata({
  params,
}: CourseRouteProps): Promise<Metadata> {
  const { slug, courseSlug } = await params;
  const catalogRepository = await getRuntimeCatalogRepository();
  const bundle = await catalogRepository.loadBySlug(slug);
  const course = bundle?.courses.find(
    (candidate) => candidate.canonicalSlug === courseSlug,
  );
  const version = course
    ? bundle?.courseVersions.find(
        (candidate) => candidate.courseId === course.id,
      )
    : undefined;
  if (!bundle || !version) {
    return { title: "Course not published — Course Atlas" };
  }
  return {
    title: `${version.title} · ${bundle.programVersion.title} — Course Atlas`,
    description: version.summary,
  };
}

export default async function CourseRoute({ params }: CourseRouteProps) {
  const { slug, courseSlug } = await params;
  const catalogRepository = await getRuntimeCatalogRepository();
  const bundle = await catalogRepository.loadBySlug(slug);
  if (!bundle) notFound();
  return <CoursePage bundle={bundle} courseSlug={courseSlug} />;
}
