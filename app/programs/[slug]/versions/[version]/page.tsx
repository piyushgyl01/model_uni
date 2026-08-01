import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRuntimeCatalogRepository } from "../../../../catalog/cloudflare-catalog";
import type { SemanticVersion } from "../../../../domain/catalog";
import ProgramPage from "../../../../program-page";

export const dynamic = "force-dynamic";

interface VersionedProgramRouteProps {
  readonly params: Promise<{ slug: string; version: string }>;
}

function semanticVersion(value: string): SemanticVersion | undefined {
  return /^\d+\.\d+\.\d+$/.test(value)
    ? (value as SemanticVersion)
    : undefined;
}

async function loadVersion(slug: string, versionValue: string) {
  const version = semanticVersion(versionValue);
  if (!version) return undefined;
  const catalogRepository = await getRuntimeCatalogRepository();
  return catalogRepository.loadBySlug(slug, version);
}

export async function generateMetadata({
  params,
}: VersionedProgramRouteProps): Promise<Metadata> {
  const { slug, version } = await params;
  const bundle = await loadVersion(slug, version);
  if (!bundle) return { title: "Program version not published — Course Atlas" };
  return {
    title: `${bundle.programVersion.title} v${version} — Course Atlas`,
    description: bundle.programVersion.summary,
  };
}

export default async function VersionedProgramRoute({
  params,
}: VersionedProgramRouteProps) {
  const { slug, version } = await params;
  const parsedVersion = semanticVersion(version);
  if (!parsedVersion) notFound();
  const catalogRepository = await getRuntimeCatalogRepository();
  const bundle = await catalogRepository.loadBySlug(slug, parsedVersion);
  if (!bundle) notFound();
  const availableVersions = await catalogRepository.listVersions(slug);
  const routeBase = `/programs/${slug}/versions/${parsedVersion}`;
  return (
    <ProgramPage
      availableVersions={availableVersions}
      bundle={bundle}
      routeBase={routeBase}
    />
  );
}
