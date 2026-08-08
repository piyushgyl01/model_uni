/**
 * Append-only release fingerprints for every checked-in catalog publication.
 *
 * Editorial fields are part of an immutable publication. Once a release is
 * recorded here, changing its canonical payload requires a new bundle and
 * program-version identity rather than updating this record.
 */
export interface CatalogPublicationLockRecord {
  readonly bundleId: string;
  readonly programId: string;
  readonly programVersionId: string;
  readonly version: string;
  readonly publishedAt: string;
  readonly canonicalBytes: number;
  readonly canonicalSha256: string;
}

export const catalogPublicationLock = [
  {
    bundleId: "bnd_019fab2b-c400-7b9d-97af-bf35dad278eb",
    programId: "prg_019fab2b-c401-7277-90e3-350c6848e164",
    programVersionId: "prv_019fab2b-c402-7cc7-b8a3-68801ab53820",
    version: "1.0.0",
    publishedAt: "2026-07-29T00:00:00Z",
    canonicalBytes: 642_334,
    canonicalSha256:
      "d68a70638e35b33582dfeadf3db35b73cb64916cbd382852b4d0caa6700fad61",
  },
  {
    bundleId: "bnd_019fbc95-32a7-7901-bff2-8d4be908e541",
    programId: "prg_019fab2b-c401-7277-90e3-350c6848e164",
    programVersionId: "prv_019fbc95-32a8-7adf-8823-425d90e4bc3d",
    version: "1.1.0",
    publishedAt: "2026-08-01T00:00:00Z",
    canonicalBytes: 646_559,
    canonicalSha256:
      "18ff6d4d72e5e314d7d4f27d5bceed5219685ec7dd29249d2d29f49c2483930d",
  },
  {
    bundleId: "bnd_course_atlas_ee_2026_1",
    programId: "prg_course_atlas_ee",
    programVersionId: "prv_course_atlas_ee_2026_1",
    version: "1.0.0",
    publishedAt: "2026-07-24T00:00:00Z",
    canonicalBytes: 747_862,
    canonicalSha256:
      "6e092754eea2976bdd868c40ba41290b5167e9942559265ed16b9ce318d74d7d",
  },
  {
    bundleId: "bnd_019fbd41-e8fb-730e-b1aa-70847f06a1c0",
    programId: "prg_019fbd41-e8fb-7067-aa3c-a202632fbbce",
    programVersionId: "prv_019fbd41-e8fb-7e37-97b1-5aac93c30231",
    version: "1.0.0",
    publishedAt: "2026-08-01T00:00:00Z",
    canonicalBytes: 680_006,
    canonicalSha256:
      "4c0bdf77d55a98e3afe3997b76e941284733ec989af477bd4ab6bd62059fd9c7",
  },
  {
    bundleId: "bnd_019fbd6e-3047-74a3-bfc9-dc89252d0c08",
    programId: "prg_019fbd6e-3047-77ac-bded-c8156ef086b2",
    programVersionId: "prv_019fbd6e-3047-78d0-80c6-db4dce70c198",
    version: "1.0.0",
    publishedAt: "2026-08-01T00:00:00Z",
    canonicalBytes: 700_513,
    canonicalSha256:
      "875166906a43701ce0aee52ba0c6ffee5767fa20d04bd61795ee2775caf109bf",
  },
  {
    bundleId: "bnd_019fc0e4-a1ab-739e-b0ac-5c458779ca0d",
    programId: "prg_019fc0e4-a1ab-773d-ae6a-a00b9368a8de",
    programVersionId: "prv_019fc0e4-a1ab-73e7-a255-4092fe15c2dc",
    version: "1.0.0",
    publishedAt: "2026-08-02T00:00:00Z",
    canonicalBytes: 696_525,
    canonicalSha256:
      "fd6005a6d61478461f977452cf83e2967ab0a2d58e048a8cd846641600a55380",
  },
  {
    bundleId: "bnd_practical_spreadsheets_2026_1",
    programId: "prg_practical_spreadsheets",
    programVersionId: "prv_practical_spreadsheets_2026_1",
    version: "1.0.0",
    publishedAt: "2026-07-29T00:00:00Z",
    canonicalBytes: 37_030,
    canonicalSha256:
      "d72890cafddc4dbf72bf94f0a86838b6072e69d397990114819cde571423ba63",
  },
] as const satisfies readonly CatalogPublicationLockRecord[];
