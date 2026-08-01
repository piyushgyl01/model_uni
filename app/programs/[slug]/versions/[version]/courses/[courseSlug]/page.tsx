import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRuntimeCatalogRepository } from "../../../../../../catalog/cloudflare-catalog";
import CoursePage from "../../../../../../course-page";
import type { SemanticVersion } from "../../../../../../domain/catalog";

export const dynamic = "force-dynamic";

interface VersionedCourseRouteProps {
  readonly params: Promise<{
    slug: string;
    version: string;
    courseSlug: string;
  }>;
}

function semanticVersion(value: string): SemanticVersion | undefined {
  return /^\d+\.\d+\.\d+$/.test(value)
    ? (value as SemanticVersion)
    : undefined;
}

async function loadCourse(
  slug: string,
  versionValue: string,
  courseSlug: string,
) {
  const version = semanticVersion(versionValue);
  if (!version) return {};
  const catalogRepository = await getRuntimeCatalogRepository();
  const bundle = await catalogRepository.loadBySlug(slug, version);
  const course = bundle?.courses.find(
    (candidate) => candidate.canonicalSlug === courseSlug,
  );
  const courseVersion = course
    ? bundle?.courseVersions.find(
        (candidate) => candidate.courseId === course.id,
      )
    : undefined;
  return { bundle, courseVersion, version };
}

export async function generateMetadata({
  params,
}: VersionedCourseRouteProps): Promise<Metadata> {
  const { slug, version, courseSlug } = await params;
  const loaded = await loadCourse(slug, version, courseSlug);
  if (!loaded.bundle || !loaded.courseVersion) {
    return { title: "Course version not published — Course Atlas" };
  }
  return {
    title: `${loaded.courseVersion.title} · ${loaded.bundle.programVersion.title} v${version} — Course Atlas`,
    description: loaded.courseVersion.summary,
  };
}

export default async function VersionedCourseRoute({
  params,
}: VersionedCourseRouteProps) {
  const { slug, version, courseSlug } = await params;
  const loaded = await loadCourse(slug, version, courseSlug);
  if (!loaded.bundle || !loaded.version) notFound();
  return (
    <CoursePage
      bundle={loaded.bundle}
      courseSlug={courseSlug}
      routeBase={`/programs/${slug}/versions/${loaded.version}`}
    />
  );
}
