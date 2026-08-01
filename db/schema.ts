import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const versionStatuses = ["draft", "published", "retired"] as const;

/**
 * Stable identities live in the unversioned tables. Anything a learner can be
 * assigned is pinned to a version so a published plan does not change in place.
 * IDs are application-supplied UUIDs/ULIDs rather than database row numbers.
 */
export const programs = sqliteTable("programs", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  archivedAt: text("archived_at"),
});

export const programVersions = sqliteTable(
  "program_versions",
  {
    id: text("id").primaryKey(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    status: text("status", { enum: versionStatuses }).notNull().default("draft"),
    title: text("title").notNull(),
    shortTitle: text("short_title"),
    summary: text("summary").notNull().default(""),
    credentialType: text("credential_type").notNull(),
    fieldOfStudy: text("field_of_study"),
    language: text("language").notNull().default("en"),
    durationValue: integer("duration_value"),
    durationUnit: text("duration_unit", {
      enum: ["days", "weeks", "months", "years"],
    }),
    nominalHours: integer("nominal_hours"),
    effectiveFrom: text("effective_from"),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("program_versions_program_number_unique").on(
      table.programId,
      table.versionNumber,
    ),
    index("program_versions_status_idx").on(table.status, table.publishedAt),
    check(
      "program_versions_positive_version_check",
      sql`${table.versionNumber} > 0`,
    ),
    check(
      "program_versions_nonnegative_duration_check",
      sql`${table.durationValue} IS NULL OR ${table.durationValue} > 0`,
    ),
    check(
      "program_versions_nonnegative_hours_check",
      sql`${table.nominalHours} IS NULL OR ${table.nominalHours} >= 0`,
    ),
  ],
);

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  archivedAt: text("archived_at"),
});

export const courseVersions = sqliteTable(
  "course_versions",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    status: text("status", { enum: versionStatuses }).notNull().default("draft"),
    code: text("code"),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    language: text("language").notNull().default("en"),
    level: text("level"),
    nominalHours: integer("nominal_hours"),
    creditValue: real("credit_value"),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("course_versions_course_number_unique").on(
      table.courseId,
      table.versionNumber,
    ),
    index("course_versions_status_idx").on(table.status, table.publishedAt),
    check(
      "course_versions_positive_version_check",
      sql`${table.versionNumber} > 0`,
    ),
    check(
      "course_versions_nonnegative_hours_check",
      sql`${table.nominalHours} IS NULL OR ${table.nominalHours} >= 0`,
    ),
    check(
      "course_versions_nonnegative_credit_check",
      sql`${table.creditValue} IS NULL OR ${table.creditValue} >= 0`,
    ),
  ],
);

/**
 * Requirement groups can describe semesters, terms, tracks, elective baskets,
 * or self-paced phases without making any one calendar shape mandatory.
 */
export const requirementGroups = sqliteTable(
  "requirement_groups",
  {
    id: text("id").primaryKey(),
    programVersionId: text("program_version_id")
      .notNull()
      .references(() => programVersions.id, { onDelete: "cascade" }),
    parentGroupId: text("parent_group_id").references(
      (): AnySQLiteColumn => requirementGroups.id,
      { onDelete: "cascade" },
    ),
    key: text("key").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    ruleKind: text("rule_kind", {
      enum: ["all_of", "choose", "credits", "hours"],
    })
      .notNull()
      .default("all_of"),
    minimumSelections: integer("minimum_selections").notNull().default(0),
    maximumSelections: integer("maximum_selections"),
    requiredCredits: real("required_credits"),
    requiredHours: integer("required_hours"),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("requirement_groups_program_key_unique").on(
      table.programVersionId,
      table.key,
    ),
    index("requirement_groups_parent_position_idx").on(
      table.parentGroupId,
      table.position,
    ),
    check(
      "requirement_groups_selection_range_check",
      sql`${table.minimumSelections} >= 0 AND (${table.maximumSelections} IS NULL OR ${table.maximumSelections} >= ${table.minimumSelections})`,
    ),
    check(
      "requirement_groups_nonnegative_credits_check",
      sql`${table.requiredCredits} IS NULL OR ${table.requiredCredits} >= 0`,
    ),
    check(
      "requirement_groups_nonnegative_hours_check",
      sql`${table.requiredHours} IS NULL OR ${table.requiredHours} >= 0`,
    ),
  ],
);

export const requirementCourseOptions = sqliteTable(
  "requirement_course_options",
  {
    id: text("id").primaryKey(),
    requirementGroupId: text("requirement_group_id")
      .notNull()
      .references(() => requirementGroups.id, { onDelete: "cascade" }),
    courseVersionId: text("course_version_id")
      .notNull()
      .references(() => courseVersions.id, { onDelete: "restrict" }),
    creditOverride: real("credit_override"),
    isRecommended: integer("is_recommended", { mode: "boolean" })
      .notNull()
      .default(false),
    position: integer("position").notNull().default(0),
    notes: text("notes").notNull().default(""),
  },
  (table) => [
    uniqueIndex("requirement_course_options_group_course_unique").on(
      table.requirementGroupId,
      table.courseVersionId,
    ),
    index("requirement_course_options_group_position_idx").on(
      table.requirementGroupId,
      table.position,
    ),
    check(
      "requirement_course_options_nonnegative_credit_check",
      sql`${table.creditOverride} IS NULL OR ${table.creditOverride} >= 0`,
    ),
  ],
);

export const contentUnits = sqliteTable(
  "content_units",
  {
    id: text("id").primaryKey(),
    courseVersionId: text("course_version_id")
      .notNull()
      .references(() => courseVersions.id, { onDelete: "cascade" }),
    parentUnitId: text("parent_unit_id").references(
      (): AnySQLiteColumn => contentUnits.id,
      { onDelete: "cascade" },
    ),
    key: text("key").notNull(),
    kind: text("kind", {
      enum: [
        "module",
        "lesson",
        "reading",
        "lab",
        "practice",
        "project",
        "assessment",
        "exam",
      ],
    })
      .notNull()
      .default("lesson"),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    instructionsMarkdown: text("instructions_markdown").notNull().default(""),
    completionRule: text("completion_rule", {
      enum: ["view", "submit", "pass", "manual"],
    })
      .notNull()
      .default("view"),
    estimatedMinutes: integer("estimated_minutes"),
    releaseOffsetDays: integer("release_offset_days"),
    dueOffsetDays: integer("due_offset_days"),
    isRequired: integer("is_required", { mode: "boolean" })
      .notNull()
      .default(true),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("content_units_course_key_unique").on(
      table.courseVersionId,
      table.key,
    ),
    index("content_units_parent_position_idx").on(
      table.parentUnitId,
      table.position,
    ),
    check(
      "content_units_nonnegative_minutes_check",
      sql`${table.estimatedMinutes} IS NULL OR ${table.estimatedMinutes} >= 0`,
    ),
    check(
      "content_units_due_after_release_check",
      sql`${table.dueOffsetDays} IS NULL OR ${table.releaseOffsetDays} IS NULL OR ${table.dueOffsetDays} >= ${table.releaseOffsetDays}`,
    ),
  ],
);

export const competencies = sqliteTable(
  "competencies",
  {
    id: text("id").primaryKey(),
    parentCompetencyId: text("parent_competency_id").references(
      (): AnySQLiteColumn => competencies.id,
      { onDelete: "restrict" },
    ),
    framework: text("framework").notNull().default("course-atlas"),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("competencies_framework_code_unique").on(
      table.framework,
      table.code,
    ),
    index("competencies_parent_idx").on(table.parentCompetencyId),
  ],
);

/**
 * A mapping targets exactly one versioned learning object. Keeping the target
 * columns explicit retains foreign-key enforcement without a polymorphic join.
 */
export const competencyMappings = sqliteTable(
  "competency_mappings",
  {
    id: text("id").primaryKey(),
    competencyId: text("competency_id")
      .notNull()
      .references(() => competencies.id, { onDelete: "restrict" }),
    programVersionId: text("program_version_id").references(
      () => programVersions.id,
      { onDelete: "cascade" },
    ),
    courseVersionId: text("course_version_id").references(
      () => courseVersions.id,
      { onDelete: "cascade" },
    ),
    contentUnitId: text("content_unit_id").references(() => contentUnits.id, {
      onDelete: "cascade",
    }),
    relation: text("relation", {
      enum: [
        "outcome",
        "teaches",
        "practices",
        "assesses",
        "prerequisite",
      ],
    }).notNull(),
    proficiencyLevel: integer("proficiency_level"),
    weight: real("weight").notNull().default(1),
    isRequired: integer("is_required", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("competency_mappings_competency_idx").on(table.competencyId),
    index("competency_mappings_program_idx").on(table.programVersionId),
    index("competency_mappings_course_idx").on(table.courseVersionId),
    index("competency_mappings_unit_idx").on(table.contentUnitId),
    check(
      "competency_mappings_one_target_check",
      sql`(
        CASE WHEN ${table.programVersionId} IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN ${table.courseVersionId} IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN ${table.contentUnitId} IS NOT NULL THEN 1 ELSE 0 END
      ) = 1`,
    ),
    check(
      "competency_mappings_proficiency_range_check",
      sql`${table.proficiencyLevel} IS NULL OR ${table.proficiencyLevel} BETWEEN 0 AND 5`,
    ),
    check(
      "competency_mappings_weight_range_check",
      sql`${table.weight} >= 0 AND ${table.weight} <= 1`,
    ),
  ],
);

export const providers = sqliteTable(
  "providers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    providerType: text("provider_type", {
      enum: [
        "university",
        "nonprofit",
        "government",
        "company",
        "community",
        "individual",
      ],
    }).notNull(),
    homepageUrl: text("homepage_url"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
  },
  (table) => [index("providers_name_idx").on(table.name)],
);

export const resources = sqliteTable(
  "resources",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "restrict" }),
    providerResourceKey: text("provider_resource_key"),
    kind: text("kind", {
      enum: [
        "course",
        "textbook",
        "article",
        "video",
        "playlist",
        "documentation",
        "software",
        "dataset",
        "lab",
        "assessment",
        "other",
      ],
    }).notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("resources_provider_key_unique").on(
      table.providerId,
      table.providerResourceKey,
    ),
    index("resources_provider_kind_idx").on(table.providerId, table.kind),
  ],
);

export const resourceVersions = sqliteTable(
  "resource_versions",
  {
    id: text("id").primaryKey(),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    status: text("status", { enum: versionStatuses }).notNull().default("draft"),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    language: text("language").notNull().default("en"),
    contentFingerprint: text("content_fingerprint"),
    sourcePublishedAt: text("source_published_at"),
    firstObservedAt: text("first_observed_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    lastObservedAt: text("last_observed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("resource_versions_resource_number_unique").on(
      table.resourceId,
      table.versionNumber,
    ),
    index("resource_versions_status_idx").on(table.status, table.lastObservedAt),
    check(
      "resource_versions_positive_version_check",
      sql`${table.versionNumber} > 0`,
    ),
  ],
);

export const accessOffers = sqliteTable(
  "access_offers",
  {
    id: text("id").primaryKey(),
    resourceVersionId: text("resource_version_id")
      .notNull()
      .references(() => resourceVersions.id, { onDelete: "cascade" }),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "restrict" }),
    url: text("url").notNull(),
    accessModel: text("access_model", {
      enum: [
        "free_full",
        "free_audit",
        "library",
        "subscription",
        "one_time_purchase",
        "unknown",
      ],
    })
      .notNull()
      .default("unknown"),
    status: text("status", {
      enum: ["available", "unavailable", "unknown"],
    })
      .notNull()
      .default("unknown"),
    loginRequired: integer("login_required", { mode: "boolean" })
      .notNull()
      .default(false),
    priceMinor: integer("price_minor"),
    currency: text("currency"),
    regionCode: text("region_code").notNull().default("*"),
    validFrom: text("valid_from"),
    validUntil: text("valid_until"),
    lastCheckedAt: text("last_checked_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("access_offers_resource_url_region_unique").on(
      table.resourceVersionId,
      table.url,
      table.regionCode,
    ),
    index("access_offers_status_checked_idx").on(
      table.status,
      table.lastCheckedAt,
    ),
    check(
      "access_offers_nonnegative_price_check",
      sql`${table.priceMinor} IS NULL OR ${table.priceMinor} >= 0`,
    ),
    check(
      "access_offers_price_currency_check",
      sql`${table.priceMinor} IS NULL OR ${table.currency} IS NOT NULL`,
    ),
  ],
);

/**
 * Rights are deliberately tri-state: nullable booleans mean "not established"
 * rather than silently treating an unknown permission as granted or denied.
 */
export const resourceRights = sqliteTable(
  "resource_rights",
  {
    id: text("id").primaryKey(),
    resourceVersionId: text("resource_version_id")
      .notNull()
      .references(() => resourceVersions.id, { onDelete: "cascade" }),
    jurisdiction: text("jurisdiction").notNull().default("*"),
    basis: text("basis", {
      enum: [
        "open_license",
        "public_domain",
        "provider_terms",
        "permission",
        "link_only",
        "unknown",
      ],
    })
      .notNull()
      .default("unknown"),
    licenseIdentifier: text("license_identifier"),
    licenseUrl: text("license_url"),
    rightsHolder: text("rights_holder"),
    evidenceUrl: text("evidence_url"),
    canLink: integer("can_link", { mode: "boolean" }),
    canRedistribute: integer("can_redistribute", { mode: "boolean" }),
    canAdapt: integer("can_adapt", { mode: "boolean" }),
    commercialUse: integer("commercial_use", { mode: "boolean" }),
    verifiedAt: text("verified_at"),
    validUntil: text("valid_until"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("resource_rights_scope_basis_unique").on(
      table.resourceVersionId,
      table.jurisdiction,
      table.basis,
    ),
    index("resource_rights_verification_idx").on(
      table.verifiedAt,
      table.validUntil,
    ),
  ],
);
 
export const resourceFreshness = sqliteTable(
  "resource_freshness",
  {
    id: text("id").primaryKey(),
    resourceVersionId: text("resource_version_id")
      .notNull()
      .references(() => resourceVersions.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: [
        "healthy",
        "redirected",
        "temporarily_unavailable",
        "broken",
        "unchecked",
      ],
    })
      .notNull()
      .default("unchecked"),
    checkedAt: text("checked_at"),
    httpStatus: integer("http_status"),
    resolvedUrl: text("resolved_url"),
    contentFingerprint: text("content_fingerprint"),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("resource_freshness_resource_version_unique").on(
      table.resourceVersionId,
    ),
    index("resource_freshness_status_idx").on(table.status, table.checkedAt),
  ],
);

export const contentUnitResources = sqliteTable(
  "content_unit_resources",
  {
    id: text("id").primaryKey(),
    contentUnitId: text("content_unit_id")
      .notNull()
      .references(() => contentUnits.id, { onDelete: "cascade" }),
    resourceVersionId: text("resource_version_id")
      .notNull()
      .references(() => resourceVersions.id, { onDelete: "restrict" }),
    preferredAccessOfferId: text("preferred_access_offer_id").references(
      () => accessOffers.id,
      { onDelete: "set null" },
    ),
    role: text("role", {
      enum: [
        "primary",
        "supplement",
        "reference",
        "lab",
        "practice",
        "assessment",
      ],
    })
      .notNull()
      .default("primary"),
    instructions: text("instructions").notNull().default(""),
    startLocator: text("start_locator"),
    endLocator: text("end_locator"),
    isRequired: integer("is_required", { mode: "boolean" })
      .notNull()
      .default(true),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    uniqueIndex("content_unit_resources_unit_resource_role_unique").on(
      table.contentUnitId,
      table.resourceVersionId,
      table.role,
    ),
    index("content_unit_resources_unit_position_idx").on(
      table.contentUnitId,
      table.position,
    ),
  ],
);

/**
 * Provenance and audit records use stable entity type/id pairs intentionally:
 * they must be able to describe a record even after the source table evolves.
 */
export const provenanceAssertions = sqliteTable(
  "provenance_assertions",
  {
    id: text("id").primaryKey(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    predicate: text("predicate").notNull(),
    valueJson: text("value_json", { mode: "json" }).$type<unknown>().notNull(),
    sourceResourceVersionId: text("source_resource_version_id").references(
      () => resourceVersions.id,
      { onDelete: "set null" },
    ),
    sourceUrl: text("source_url"),
    assertedBy: text("asserted_by").notNull(),
    confidence: real("confidence"),
    observedAt: text("observed_at"),
    assertedAt: text("asserted_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    retractedAt: text("retracted_at"),
  },
  (table) => [
    index("provenance_assertions_subject_idx").on(
      table.subjectType,
      table.subjectId,
    ),
    index("provenance_assertions_source_idx").on(
      table.sourceResourceVersionId,
    ),
    check(
      "provenance_assertions_confidence_range_check",
      sql`${table.confidence} IS NULL OR ${table.confidence} BETWEEN 0 AND 1`,
    ),
  ],
);

/**
 * Slugs are aliases, not identities. Each row points to exactly one stable
 * entity, so renames and redirects never change foreign keys.
 */
export const slugAliases = sqliteTable(
  "slug_aliases",
  {
    id: text("id").primaryKey(),
    namespace: text("namespace", {
      enum: ["program", "course", "competency", "provider", "resource"],
    }).notNull(),
    programId: text("program_id").references(() => programs.id, {
      onDelete: "cascade",
    }),
    courseId: text("course_id").references(() => courses.id, {
      onDelete: "cascade",
    }),
    competencyId: text("competency_id").references(() => competencies.id, {
      onDelete: "cascade",
    }),
    providerId: text("provider_id").references(() => providers.id, {
      onDelete: "cascade",
    }),
    resourceId: text("resource_id").references(() => resources.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull(),
    locale: text("locale").notNull().default("en"),
    isCanonical: integer("is_canonical", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    retiredAt: text("retired_at"),
  },
  (table) => [
    uniqueIndex("slug_aliases_route_unique").on(
      table.namespace,
      table.locale,
      table.slug,
    ),
    index("slug_aliases_program_idx").on(table.programId),
    index("slug_aliases_course_idx").on(table.courseId),
    index("slug_aliases_competency_idx").on(table.competencyId),
    index("slug_aliases_provider_idx").on(table.providerId),
    index("slug_aliases_resource_idx").on(table.resourceId),
    check(
      "slug_aliases_one_target_check",
      sql`(
        CASE WHEN ${table.programId} IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN ${table.courseId} IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN ${table.competencyId} IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN ${table.providerId} IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN ${table.resourceId} IS NOT NULL THEN 1 ELSE 0 END
      ) = 1`,
    ),
    check(
      "slug_aliases_namespace_target_check",
      sql`(${table.namespace} = 'program' AND ${table.programId} IS NOT NULL)
        OR (${table.namespace} = 'course' AND ${table.courseId} IS NOT NULL)
        OR (${table.namespace} = 'competency' AND ${table.competencyId} IS NOT NULL)
        OR (${table.namespace} = 'provider' AND ${table.providerId} IS NOT NULL)
        OR (${table.namespace} = 'resource' AND ${table.resourceId} IS NOT NULL)`,
    ),
  ],
);

/**
 * The normalized catalog tables above support relational authoring and
 * discovery. This publication table is the immutable, canonical snapshot used
 * at runtime. Keeping the validated bundle JSON intact guarantees that a D1
 * read reconstructs every optional field and ordered array without guessing.
 */
export const catalogBundles = sqliteTable(
  "catalog_bundles",
  {
    id: text("id").primaryKey(),
    schemaVersion: integer("schema_version").notNull(),
    programId: text("program_id").notNull(),
    programVersionId: text("program_version_id").notNull(),
    canonicalSlug: text("canonical_slug").notNull(),
    semanticVersion: text("semantic_version").notNull(),
    publishedAt: text("published_at").notNull(),
    payloadHash: text("payload_hash").notNull(),
    summaryJson: text("summary_json", { mode: "json" }).$type<unknown>().notNull(),
    seededAt: text("seeded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("catalog_bundles_program_version_id_unique").on(
      table.programVersionId,
    ),
    uniqueIndex("catalog_bundles_program_semver_unique").on(
      table.programId,
      table.semanticVersion,
    ),
    uniqueIndex("catalog_bundles_id_program_version_unique").on(
      table.id,
      table.programVersionId,
    ),
    index("catalog_bundles_slug_idx").on(
      table.canonicalSlug,
      table.semanticVersion,
    ),
    check(
      "catalog_bundles_schema_version_check",
      sql`${table.schemaVersion} > 0`,
    ),
    check(
      "catalog_bundles_payload_hash_check",
      sql`length(${table.payloadHash}) = 64`,
    ),
  ],
);

/**
 * Explicit identity corrections keep an accidentally published predecessor
 * readable by stable version ID while removing its slug from the active
 * catalog. Supersessions are never inferred from matching titles or slugs.
 */
export const catalogProgramSupersessions = sqliteTable(
  "catalog_program_supersessions",
  {
    retiredProgramId: text("retired_program_id").primaryKey(),
    successorProgramId: text("successor_program_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("catalog_program_supersessions_successor_idx").on(
      table.successorProgramId,
    ),
    check(
      "catalog_program_supersessions_distinct_ids_check",
      sql`${table.retiredProgramId} <> ${table.successorProgramId}`,
    ),
  ],
);

/**
 * Chunks keep even unusually large degree publications comfortably below D1's
 * per-row limit while preserving one byte-for-byte canonical JSON document.
 */
export const catalogBundlePayloadChunks = sqliteTable(
  "catalog_bundle_payload_chunks",
  {
    bundleId: text("bundle_id")
      .notNull()
      .references(() => catalogBundles.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    payloadChunk: text("payload_chunk").notNull(),
  },
  (table) => [
    primaryKey({
      name: "catalog_bundle_payload_chunks_pk",
      columns: [table.bundleId, table.chunkIndex],
    }),
    check(
      "catalog_bundle_payload_chunks_index_check",
      sql`${table.chunkIndex} >= 0`,
    ),
    check(
      "catalog_bundle_payload_chunks_size_check",
      sql`length(CAST(${table.payloadChunk} AS BLOB)) <= 250000`,
    ),
  ],
);

export const learners = sqliteTable("learners", {
  id: text("id").primaryKey(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Accounts separate a platform identity from the learner record so another
 * authentication provider can be linked later without moving progress.
 */
export const learnerAccounts = sqliteTable(
  "learner_accounts",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerSubject: text("provider_subject").notNull(),
    email: text("email"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastSeenAt: text("last_seen_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("learner_accounts_provider_subject_unique").on(
      table.provider,
      table.providerSubject,
    ),
    index("learner_accounts_learner_idx").on(table.learnerId),
    check(
      "learner_accounts_provider_check",
      sql`length(trim(${table.provider})) > 0`,
    ),
    check(
      "learner_accounts_subject_check",
      sql`length(trim(${table.providerSubject})) > 0`,
    ),
  ],
);

/**
 * Progress is pinned to one immutable publication. The composite foreign key
 * prevents a bundle ID from being paired with a different program version.
 */
export const learnerProgramProgress = sqliteTable(
  "learner_program_progress",
  {
    learnerId: text("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    programVersionId: text("program_version_id").notNull(),
    bundleId: text("bundle_id").notNull(),
    selectedConcentrationId: text("selected_concentration_id"),
    startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({
      name: "learner_program_progress_pk",
      columns: [table.learnerId, table.programVersionId],
    }),
    foreignKey({
      name: "learner_program_progress_bundle_version_fk",
      columns: [table.bundleId, table.programVersionId],
      foreignColumns: [catalogBundles.id, catalogBundles.programVersionId],
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    index("learner_program_progress_bundle_idx").on(table.bundleId),
    index("learner_program_progress_updated_idx").on(table.updatedAt),
  ],
);

/**
 * Course completion is derived from completed units; no mutable percentage is
 * stored. Membership in the exact bundle is checked by the write repository
 * before these IDs are inserted.
 */
export const learnerUnitCompletions = sqliteTable(
  "learner_unit_completions",
  {
    learnerId: text("learner_id").notNull(),
    programVersionId: text("program_version_id").notNull(),
    courseVersionId: text("course_version_id").notNull(),
    learningUnitId: text("learning_unit_id").notNull(),
    completedAt: text("completed_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({
      name: "learner_unit_completions_pk",
      columns: [
        table.learnerId,
        table.programVersionId,
        table.courseVersionId,
        table.learningUnitId,
      ],
    }),
    foreignKey({
      name: "learner_unit_completions_progress_fk",
      columns: [table.learnerId, table.programVersionId],
      foreignColumns: [
        learnerProgramProgress.learnerId,
        learnerProgramProgress.programVersionId,
      ],
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    index("learner_unit_completions_program_idx").on(
      table.learnerId,
      table.programVersionId,
    ),
    index("learner_unit_completions_course_idx").on(
      table.learnerId,
      table.programVersionId,
      table.courseVersionId,
    ),
  ],
);

/**
 * A client-generated import ID makes the one-time localStorage consent flow
 * durable across retries. payloadHash detects accidental ID reuse with
 * different content; disposition "cloud" records a deliberate no-import
 * choice without copying any client completions.
 */
export const learnerProgressImports = sqliteTable(
  "learner_progress_imports",
  {
    learnerId: text("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    clientImportId: text("client_import_id").notNull(),
    storageNamespace: text("storage_namespace").notNull(),
    disposition: text("disposition", { enum: ["merged", "cloud"] }).notNull(),
    payloadHash: text("payload_hash").notNull(),
    importedUnitCount: integer("imported_unit_count").notNull().default(0),
    confirmedAt: text("confirmed_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({
      name: "learner_progress_imports_pk",
      columns: [table.learnerId, table.clientImportId],
    }),
    index("learner_progress_imports_confirmed_idx").on(
      table.learnerId,
      table.confirmedAt,
    ),
    check(
      "learner_progress_imports_namespace_check",
      sql`length(trim(${table.storageNamespace})) > 0`,
    ),
    check(
      "learner_progress_imports_hash_check",
      sql`length(${table.payloadHash}) = 64`,
    ),
    check(
      "learner_progress_imports_count_check",
      sql`${table.importedUnitCount} >= 0`,
    ),
  ],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    correlationId: text("correlation_id"),
    beforeJson: text("before_json", { mode: "json" }).$type<unknown>(),
    afterJson: text("after_json", { mode: "json" }).$type<unknown>(),
    metadataJson: text("metadata_json", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    occurredAt: text("occurred_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("audit_events_entity_time_idx").on(
      table.entityType,
      table.entityId,
      table.occurredAt,
    ),
    index("audit_events_correlation_idx").on(table.correlationId),
  ],
);

export const outboxEvents = sqliteTable(
  "outbox_events",
  {
    id: text("id").primaryKey(),
    topic: text("topic").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    payloadJson: text("payload_json", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
    status: text("status", {
      enum: ["pending", "processing", "processed", "failed"],
    })
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: text("available_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lockedAt: text("locked_at"),
    processedAt: text("processed_at"),
    lastError: text("last_error"),
  },
  (table) => [
    index("outbox_events_dispatch_idx").on(table.status, table.availableAt),
    index("outbox_events_aggregate_idx").on(
      table.aggregateType,
      table.aggregateId,
    ),
    check("outbox_events_attempts_check", sql`${table.attempts} >= 0`),
  ],
);
