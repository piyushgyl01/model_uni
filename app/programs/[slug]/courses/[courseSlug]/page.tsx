import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogRepository } from "../../../../../content/catalog";
import CoursePage from "../../../../course-page";

interface CourseRouteProps {
  readonly params: Promise<{ slug: string; courseSlug: string }>;
}

export async function generateMetadata({
  params,
}: CourseRouteProps): Promise<Metadata> {
  const { slug, courseSlug } = await params;
  const bundle = catalogRepository.loadBySlug(slug);
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
  const bundle = catalogRepository.loadBySlug(slug);
  if (!bundle) notFound();
  return <CoursePage bundle={bundle} courseSlug={courseSlug} />;
}
